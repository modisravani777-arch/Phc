import os

import psycopg
from django.db import connections
from django.test.runner import DiscoverRunner


class NeonDiscoverRunner(DiscoverRunner):
    def teardown_databases(self, old_config, **kwargs):
        test_database_name = connections["default"].settings_dict["NAME"]
        admin_url = os.environ.get("DIRECT_URL") or os.environ["DATABASE_URL"]
        with psycopg.connect(admin_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = %s AND pid <> pg_backend_pid()
                    """,
                    (test_database_name,),
                )
        super().teardown_databases(old_config, **kwargs)
