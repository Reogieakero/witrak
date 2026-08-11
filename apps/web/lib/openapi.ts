export const PERMISSION_KEYS = [
  "events_create",
  "events_edit",
  "events_delete",
  "events_view",
  "attendance_scan",
  "attendance_view",
  "attendance_edit",
  "transparency_upload",
  "transparency_delete",
  "transparency_view",
  "sanctions_create",
  "sanctions_view",
  "sanctions_view_own",
  "sanctions_resolve",
  "sanctions_appeal_respond",
  "fees_create",
  "fees_verify_payment",
  "fees_view",
  "announcements_create",
  "announcements_delete",
  "announcements_view",
  "users_manage_roles",
  "audit_view",
] as const;

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FHUSOCOM API",
    version: "0.1.0",
    description:
      "Student Government Management System REST API. Every endpoint requires a signed-in session (NextAuth JWT cookie) and is authorized per-endpoint with RBAC permission keys. Unauthenticated calls return 401; authenticated calls missing the required permission return 403.",
  },
  servers: [{ url: "/" }],
  security: [{ sessionCookie: [] }],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description:
          "NextAuth JWT session cookie. Set automatically after signing in through the credentials provider at /api/auth.",
      },
    },
    responses: {
      Unauthorized: {
        description: "No valid session cookie.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Forbidden: {
        description: "Authenticated but missing the required permission.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
      PermissionKey: {
        type: "string",
        enum: PERMISSION_KEYS,
      },
      UserAccess: {
        type: "object",
        properties: {
          permissions: {
            type: "array",
            items: { $ref: "#/components/schemas/PermissionKey" },
          },
          scopeSectionIds: {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description:
              "Null = faculty-wide (all sections). Otherwise the set of section ids the caller can access.",
          },
        },
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          location: { type: "string", nullable: true },
          requiresAttendance: { type: "boolean" },
          createdById: { type: "string" },
          _count: {
            type: "object",
            properties: { attendances: { type: "integer" } },
          },
        },
      },
      AttendanceRecord: {
        type: "object",
        properties: {
          id: { type: "string" },
          eventId: { type: "string" },
          studentId: { type: "string" },
          status: {
            type: "string",
            enum: ["PRESENT", "ABSENT", "EXCUSED", "LATE"],
          },
          scannedAt: { type: "string", format: "date-time" },
          student: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              studentNo: { type: "string" },
            },
          },
          event: {
            type: "object",
            properties: {
              title: { type: "string" },
              startsAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/events": {
      get: {
        summary: "List recent events",
        description:
          "Requires events.view. Returns up to 50 events ordered by start date (newest first), each with its attendance count.",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    events: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Event" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/api/attendance": {
      get: {
        summary: "List attendance records (scope-enforced)",
        description:
          "Requires attendance.view. Records are filtered to the caller's scope sections: faculty-wide access sees all sections, scoped access only sees its own sections. Returns up to 100 records, newest first.",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    records: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AttendanceRecord" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
  },
} as const;
