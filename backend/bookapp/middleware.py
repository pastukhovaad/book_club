"""
Custom middleware for security headers.
"""


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers for XSS protection.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content Security Policy - restrict sources of content
        # This helps prevent XSS attacks by controlling what resources can be loaded
        response['Content-Security-Policy'] = (
            "default-src 'self'; "  # Only load resources from same origin by default
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Allow inline scripts (needed for React)
            "style-src 'self' 'unsafe-inline'; "  # Allow inline styles
            "img-src 'self' data: blob: http://localhost:9000 https:; "  # Allow images from self, data URIs, MinIO, and HTTPS
            "font-src 'self' data:; "  # Allow fonts from self and data URIs
            "connect-src 'self' http://localhost:* https:; "  # Allow API calls to self and localhost
            "frame-ancestors 'none'; "  # Prevent framing (same as X-Frame-Options: DENY)
        )

        # Permissions Policy - disable dangerous features
        response['Permissions-Policy'] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )

        return response
