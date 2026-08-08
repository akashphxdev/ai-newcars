self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/:brandSlug((?!new-cars|electric-cars|upcoming-cars|compare-cars|used-cars)[a-z0-9-]+)-cars/:path*",
        "destination": "/brand/:brandSlug/:path*"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()