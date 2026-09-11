/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_seed_data from "../lib/seed_data.js";
import type * as lib_video from "../lib/video.js";
import type * as lib_views from "../lib/views.js";
import type * as messaging from "../messaging.js";
import type * as postInteractions from "../postInteractions.js";
import type * as posts from "../posts.js";
import type * as profiles from "../profiles.js";
import type * as seed from "../seed.js";
import type * as social from "../social.js";
import type * as uploads from "../uploads.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/seed_data": typeof lib_seed_data;
  "lib/video": typeof lib_video;
  "lib/views": typeof lib_views;
  messaging: typeof messaging;
  postInteractions: typeof postInteractions;
  posts: typeof posts;
  profiles: typeof profiles;
  seed: typeof seed;
  social: typeof social;
  uploads: typeof uploads;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
