from django.db import migrations

ROLE_CONSTRAINT = "users_role_check"


def _replace_role_constraint(schema_editor, allowed_roles):
    if schema_editor.connection.vendor != "postgresql":
        return

    table_name = schema_editor.quote_name("users")
    constraint_name = schema_editor.quote_name(ROLE_CONSTRAINT)
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM pg_constraint "
            "WHERE conrelid = to_regclass(%s) AND conname = %s",
            ["users", ROLE_CONSTRAINT],
        )
        if cursor.fetchone() is None:
            raise RuntimeError(
                f"Expected PostgreSQL constraint {ROLE_CONSTRAINT!r} on the users table"
            )

        cursor.execute(f"ALTER TABLE {table_name} DROP CONSTRAINT {constraint_name}")
        values = ", ".join(f"'{role}'" for role in allowed_roles)
        cursor.execute(
            f"ALTER TABLE {table_name} ADD CONSTRAINT {constraint_name} "
            f"CHECK (role IN ({values}))"
        )


def expand_staff_roles(apps, schema_editor):
    _replace_role_constraint(
        schema_editor,
        ("ASHA", "SUPERVISOR", "MEDICAL_OFFICER", "ADMIN", "ANM", "OTHER"),
    )


def restore_original_staff_roles(apps, schema_editor):
    _replace_role_constraint(
        schema_editor,
        ("ASHA", "SUPERVISOR", "MEDICAL_OFFICER", "ADMIN"),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0007_facility_schedule_date_and_neon_lookup_indexes"),
    ]

    operations = [
        migrations.RunPython(expand_staff_roles, restore_original_staff_roles),
    ]
