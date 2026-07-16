import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://educonnect.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/teacher/", "/courses/", "/jee", "/neet"],
        disallow: [
          "/admin/",
          "/admin-login",
          "/student/",
          "/teacher/dashboard",
          "/teacher/wizard",
          "/teacher/courses/",
          "/teacher/packages/",
          "/teacher/sessions/",
          "/parent/",
          "/api/",
          "/schedule/",
          "/invite/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
