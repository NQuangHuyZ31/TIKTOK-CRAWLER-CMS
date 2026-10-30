import csv
import io
import logging
import random
from pathlib import Path

from core.config import DATASETS_DIR, SERVICE_ROOT
from core.utils import extract_username_from_url, normalize_username

logger = logging.getLogger(__name__)

USERNAME_COLUMN_ALIASES = (
    "username",
    "account_id",
    "unique_id",
    "uniqueid",
    "user_name",
    "handle",
    "account",
    "tiktok_username",
    "author",
)

URL_COLUMN_ALIASES = (
    "profile_url",
    "url",
    "link",
    "tiktok_url",
    "account_url",
    "channel_url",
)


class DatasetInsufficientError(ValueError):
    """Raised when the dataset pool has fewer accounts than requested."""

    def __init__(self, requested: int, available: int):
        super().__init__(
            f"Requested {requested} accounts, but dataset pool only contains {available} unique account(s)."
        )
        self.requested = requested
        self.available = available


class DatasetLoader:
    """
    Loads, normalizes, deduplicates, and caches TikTok usernames from CSV/TXT files
    in the datasets directory. Automatically reloads when files change.
    """

    def __init__(self, datasets_dir: Path | str | None = None):
        self._explicit_dir = Path(datasets_dir) if datasets_dir else None
        self.datasets_dir = self._explicit_dir or DATASETS_DIR
        self._cached_usernames: list[str] = []
        self._cached_signature: tuple[tuple[str, float, int], ...] | None = None
        self._rng = random.SystemRandom()

    FALLBACK_FILENAMES = {"example.csv", "sample.csv", "example.txt", "sample.txt"}

    def _list_dataset_files(self) -> list[Path]:
        if not self.datasets_dir.is_dir():
            return []

        all_files: list[Path] = []
        for ext in ("*.csv", "*.txt"):
            all_files.extend(sorted(self.datasets_dir.glob(ext)))

        unique_files = sorted(set(all_files))
        primary_files = [
            f for f in unique_files if f.name.lower() not in self.FALLBACK_FILENAMES
        ]
        if primary_files:
            return primary_files
        return unique_files

    def _compute_signature(self, files: list[Path]) -> tuple[tuple[str, float, int], ...]:
        sig: list[tuple[str, float, int]] = []
        for file_path in files:
            try:
                stat = file_path.stat()
                sig.append((str(file_path), stat.st_mtime, stat.st_size))
            except OSError:
                continue
        return tuple(sig)

    def get_pool(self) -> list[str]:
        """Return deduplicated list of usernames across all dataset files (cached by mtime)."""
        files = self._list_dataset_files()
        signature = self._compute_signature(files)

        if self._cached_signature == signature and self._cached_usernames:
            return list(self._cached_usernames)

        seen_lower: set[str] = set()
        pool: list[str] = []

        for file_path in files:
            try:
                extracted = self._read_file(file_path)
                for username in extracted:
                    key = username.lower()
                    if key not in seen_lower:
                        seen_lower.add(key)
                        pool.append(username)
            except Exception as error:
                logger.warning("Failed to read dataset file %s: %s", file_path, error)

        self._cached_usernames = pool
        self._cached_signature = signature
        logger.info("Dataset pool loaded: %d unique usernames from %d file(s)", len(pool), len(files))
        return list(pool)

    def sample_usernames(
        self,
        count: int,
        exclude: set[str] | list[str] | None = None,
    ) -> list[str]:
        """Randomly sample `count` unique usernames from the dataset pool without replacement."""
        if count <= 0:
            raise ValueError("Count must be a positive integer.")

        pool = self.get_pool()
        if exclude:
            excluded_lower = {normalize_username(u).lower() for u in exclude if normalize_username(u)}
            pool = [u for u in pool if u.lower() not in excluded_lower]

        if len(pool) < count:
            raise DatasetInsufficientError(requested=count, available=len(pool))

        return self._rng.sample(pool, count)

    def _read_file(self, file_path: Path) -> list[str]:
        raw_bytes = file_path.read_bytes()
        text = self._decode_bytes(raw_bytes)
        if not text.strip():
            return []

        if file_path.suffix.lower() == ".txt":
            return self._parse_txt(text)
        return self._parse_csv(text, file_path.name)

    @staticmethod
    def _decode_bytes(raw_bytes: bytes) -> str:
        for encoding in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                return raw_bytes.decode(encoding)
            except UnicodeDecodeError:
                continue
        return raw_bytes.decode("utf-8", errors="ignore")

    @staticmethod
    def _parse_txt(text: str) -> list[str]:
        usernames: list[str] = []
        for line in text.splitlines():
            clean = normalize_username(line)
            if clean and not clean.startswith("#"):
                usernames.append(clean)
        return usernames

    def _parse_csv(self, text: str, filename: str = "") -> list[str]:
        sample = text[:8192]
        delimiter = self._detect_delimiter(sample)
        stream = io.StringIO(text)
        reader = csv.reader(stream, delimiter=delimiter)

        try:
            first_row = next(reader)
        except StopIteration:
            return []

        headers = [col.strip().strip('"').strip("'").lower() for col in first_row]
        username_idx = self._find_column_index(headers, USERNAME_COLUMN_ALIASES)
        url_idx = self._find_column_index(headers, URL_COLUMN_ALIASES)

        usernames: list[str] = []

        # Handle headerless CSV if neither username nor URL column matched
        if username_idx is None and url_idx is None:
            candidate = self._extract_from_row(first_row, 0, None)
            if candidate and candidate.lower() not in USERNAME_COLUMN_ALIASES:
                usernames.append(candidate)
            for row in reader:
                val = self._extract_from_row(row, 0, None)
                if val:
                    usernames.append(val)
            return usernames

        for row in reader:
            if not row:
                continue
            val = self._extract_from_row(row, username_idx, url_idx)
            if val:
                usernames.append(val)

        return usernames

    @staticmethod
    def _detect_delimiter(sample: str) -> str:
        first_line = sample.splitlines()[0] if sample.splitlines() else sample
        try:
            dialect = csv.Sniffer().sniff(first_line, delimiters=",;\t|")
            return dialect.delimiter
        except csv.Error:
            counts = {d: first_line.count(d) for d in (",", ";", "\t")}
            best = max(counts, key=counts.get)
            return best if counts[best] > 0 else ","

    @staticmethod
    def _find_column_index(headers: list[str], aliases: tuple[str, ...]) -> int | None:
        for alias in aliases:
            if alias in headers:
                return headers.index(alias)
        return None

    @staticmethod
    def _extract_from_row(
        row: list[str],
        username_idx: int | None,
        url_idx: int | None,
    ) -> str:
        candidate = ""
        if username_idx is not None and username_idx < len(row):
            raw = row[username_idx].strip()
            # Avoid mistaking pure 16+ digit numeric TikTok IDs for usernames if URL is available
            if raw and not (raw.isdigit() and len(raw) >= 15 and url_idx is not None):
                candidate = normalize_username(raw)

        if not candidate and url_idx is not None and url_idx < len(row):
            candidate = extract_username_from_url(row[url_idx])

        return candidate
