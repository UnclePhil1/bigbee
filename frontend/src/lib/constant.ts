import createEdgeClient from "@honeycomb-protocol/edge-client";

const API_URL = "https://edge.main.honeycombprotocol.com/";

export const client = createEdgeClient(API_URL, true);