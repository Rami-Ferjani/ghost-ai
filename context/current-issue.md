After i login im redirected to this route [http://localhost:3000/sign-in/sso-callback](http://localhost:3000/sign-in/sso-callback) and im getting 404 this page could not be found  
and in the terminal im getting this error   
[browser] ⨯ unhandledRejection: Error:

Clerk: The &lt;SignIn/&gt; component is not configured correctly. The most likely reasons for this error are:

1. The "/sign-in" route is not a catch-all route.

It is recommended to convert this route to a catch-all route, eg: "/sign-in/[[...rest]]/page.tsx". Alternatively, you can update the &lt;SignIn/&gt; component to use hash-based routing by setting the "routing" prop to "hash".

2. The &lt;SignIn/&gt; component is mounted in a catch-all route, but all routes under "/sign-in" are protected by the middleware.

To resolve this, ensure that the middleware does not protect the catch-all route or any of its children. If you are using the "createRouteMatcher" helper, consider adding "(.\*)" to the end of the route pattern, eg: "/sign-in(.\*)". For more information, see: [https://clerk.com/docs/reference/nextjs/clerk-middleware#create-route-matcher](https://clerk.com/docs/reference/nextjs/clerk-middleware#create-route-matcher)

 GET /sign-in/sso-callback 404 in 73ms (next.js: 12ms, proxy.ts: 21ms, application-code: 41ms)

