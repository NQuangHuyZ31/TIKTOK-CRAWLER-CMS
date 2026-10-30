import asyncio


class _DummySelfPipeSocket:
    def fileno(self) -> int:
        return -1

    def send(self, data: bytes) -> int:
        return len(data)

    def close(self) -> None:
        pass


def patch_windows_self_pipe_if_needed() -> None:
    """Allow asyncio event loops to run in restricted Windows sandboxes where loopback socketpair() blocks."""
    loop_cls = getattr(asyncio, "ProactorEventLoop", None)
    if loop_cls is None:
        return

    def _make_self_pipe(self) -> None:
        self._ssock = _DummySelfPipeSocket()
        self._csock = _DummySelfPipeSocket()
        self._internal_fds += 1

    def _close_self_pipe(self) -> None:
        if getattr(self, "_self_reading_future", None) is not None:
            self._self_reading_future.cancel()
            self._self_reading_future = None
        self._ssock = None
        self._csock = None
        self._internal_fds -= 1

    def _loop_self_reading(self, f=None) -> None:
        pass

    def _write_to_self(self) -> None:
        pass

    loop_cls._make_self_pipe = _make_self_pipe
    loop_cls._close_self_pipe = _close_self_pipe
    loop_cls._loop_self_reading = _loop_self_reading
    loop_cls._write_to_self = _write_to_self
