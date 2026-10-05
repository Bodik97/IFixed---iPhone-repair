import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/moi-remonty(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect({ unauthenticatedUrl: new URL("/vhid", req.url).toString() });
  }
});

export const config = {
  matcher: [
    // Пропускаємо внутрішні файли Next.js, статику і службові запити Workflow
    // (інакше Clerk перехоплює їхній POST, і заснуле нагадування не прокидається)
    "/((?!_next|\\.well-known/workflow/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
