from datetime import datetime

from bs4 import BeautifulSoup

from models import TikTokAccount


def extract_profile(
    html: str,
    profile_url: str
) -> TikTokAccount:
    """
    Extract TikTok account information from HTML.
    """

    soup = BeautifulSoup(html, "html.parser")

	# get username from profile page
    username_tag = soup.find(
        "h2",
        {"data-e2e": "user-subtitle"}
    )

    username = (
        username_tag.get_text(strip=True)
        if username_tag
        else None
    )

	# get followers from profile page
    followers_tag = soup.find(
        "strong",
        {"data-e2e": "followers-count"}
    )

    followers = parse_count(followers_tag)

	# get following from profile page
    following_tag = soup.find(
        "strong",
        {"data-e2e": "following-count"}
    )

    following = parse_count(following_tag)

	# get likes from profile page
    likes_tag = soup.find(
        "strong",
        {"data-e2e": "likes-count"}
    )

    likes = parse_count(likes_tag)


    now = datetime.now()

    # create TikTokAccount object
    account = TikTokAccount(
        username=username,
        followers=followers,
        following=following,
        likes=likes,
        profile_url=profile_url,
        crawled_at=now,
        status="active" if username else "inactive",
        last_crawled_at=now
    )

    # return the account object
    return account


# function to parse count from tag
def parse_count(tag) -> int:

    if not tag:
        return 0

    text = tag.get_text(strip=True)

    return parse_count_text(text)


# function to parse count from text
def parse_count_text(text: str) -> int:


    if not text:
        return 0

    # Normalize text
    text = (
        text
        .strip()
        .replace(",", "")
        .replace(" ", "")
        .upper()
    )

    try:

        # Thousand
        if text.endswith("K"):
            number = float(text[:-1])
            return int(number * 1_000)

        # Million
        if text.endswith("M"):
            number = float(text[:-1])
            return int(number * 1_000_000)

        # Billion
        if text.endswith("B"):
            number = float(text[:-1])
            return int(number * 1_000_000_000)

        # Normal number
        return int(float(text))

    except (ValueError, TypeError):
        return 0