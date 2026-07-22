import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

export default function robots(): MetadataRoute.Robots {
  // Only production may be indexed. Staging serves the same pages on a public
  // URL, so without this it would compete with novusclasses.in in search.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

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
