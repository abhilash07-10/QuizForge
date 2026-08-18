import time
from collections import defaultdict
from functools import wraps
from threading import Lock

from flask import request, jsonify

# Simple in-process sliding-window rate limiter. Good enough for a portfolio
# demo on a single web worker; swap for Redis-backed limiting in a real
# multi-instance production deployment.
_hits = defaultdict(list)
_lock = Lock()


def rate_limited(max_requests: int = 10, window_seconds: int = 60):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            key = f"{f.__name__}:{request.remote_addr}"
            now = time.time()
            with _lock:
                recent = [t for t in _hits[key] if now - t < window_seconds]
                if len(recent) >= max_requests:
                    return jsonify({"error": "Too many requests. Please try again shortly."}), 429
                recent.append(now)
                _hits[key] = recent
            return f(*args, **kwargs)

        return wrapped

    return decorator
