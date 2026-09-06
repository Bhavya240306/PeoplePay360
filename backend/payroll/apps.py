import os
import sys

from django.apps import AppConfig


class PayrollConfig(AppConfig):
    name = 'payroll'

    def ready(self):
        # Only start the scheduler for the actual dev server process (not
        # for migrate/shell/tests). With the autoreloader on, Django forks a
        # child process with RUN_MAIN=true and it's that child we want; with
        # --noreload there's no fork at all, so RUN_MAIN is never set.
        if "runserver" not in sys.argv:
            return
        if os.environ.get("RUN_MAIN") != "true" and "--noreload" not in sys.argv:
            return

        from apscheduler.schedulers.background import BackgroundScheduler
        from .services import generate_monthly_payruns

        def _run_generation():
            try:
                generate_monthly_payruns()
            except Exception:
                # Best-effort background job — never take the server down.
                pass

        scheduler = BackgroundScheduler()
        scheduler.add_job(_run_generation, "cron", hour=1, minute=0, id="generate_monthly_payruns")
        scheduler.start()
