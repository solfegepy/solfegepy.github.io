export const CONVERSION_EXAMPLES = {
  base64: {
    forward: "Hello, world!",
    reverse: "SGVsbG8sIHdvcmxkIQ==",
  },
  url: {
    forward: "https://example.com/search?q=hello world~",
    reverse: "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world~",
  },
  query: {
    forward: "?name=Ada&active=true",
    reverse: '{\n  "name": "Ada",\n  "active": "true"\n}',
  },
  python: {
    forward: "{'name': 'Ada', 'active': True}",
    reverse: '{\n  "name": "Ada",\n  "active": true\n}',
  },
  timestamp: () => {
    const seconds = Math.floor(Date.now() / 1_000);
    return {
      forward: new Date(seconds * 1_000).toISOString().replace(".000Z", "Z"),
      reverse: String(seconds),
    };
  },
} as const;
