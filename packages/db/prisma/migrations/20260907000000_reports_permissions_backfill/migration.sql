-- Backfill reports permissions for databases created before 20260906000000_reports_admin_panel.
-- That migration only added the enum values; existing Permission / RolePermission
-- rows were never created, so hasPermission(access, "reports_view") failed and
-- /admin/reports redirected to /admin/dashboard for every non-reseeded DB.

-- Ensure Permission rows exist.
INSERT INTO "Permission" ("id", "key")
VALUES (gen_random_uuid()::text, 'reports_view'::"PermissionKey")
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Permission" ("id", "key")
VALUES (gen_random_uuid()::text, 'reports_manage'::"PermissionKey")
ON CONFLICT ("key") DO NOTHING;

-- reports_view: Super Admin, Secretary, Discipline Officer, Year/Program Rep, Vice President, Adviser
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT "Role"."id", "Permission"."id"
FROM "Role", "Permission"
WHERE "Role"."name" IN ('Super Admin', 'Secretary', 'Discipline Officer', 'Year/Program Rep', 'Vice President', 'Adviser')
  AND "Permission"."key" = 'reports_view'::"PermissionKey"
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- reports_manage: Super Admin, Secretary, Discipline Officer, Vice President
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT "Role"."id", "Permission"."id"
FROM "Role", "Permission"
WHERE "Role"."name" IN ('Super Admin', 'Secretary', 'Discipline Officer', 'Vice President')
  AND "Permission"."key" = 'reports_manage'::"PermissionKey"
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
