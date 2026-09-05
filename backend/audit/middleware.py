import threading

_thread_locals = threading.local()


class CurrentUserMiddleware:
    """
    Signals (post_save, post_delete) don't receive the request object,
    so they have no way to know WHO made a change. This middleware
    stashes the current request's user in thread-local storage, which
    signals.py reads from — a well-known Django pattern for this exact gap.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, "user", None)
        response = self.get_response(request)
        return response


def get_current_user():
    return getattr(_thread_locals, "user", None)