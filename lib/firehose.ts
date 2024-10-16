import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";
import debug from "debug";
import { Queue } from "bullmq";

export const queue = new Queue("firehose", {
  connection: {
    host: "myredis.taskforce.run",
    port: 32856,
  },
});

const log = debug("xblock:firehose");

const jetstream = new Jetstream({
  ws: WebSocket,
  wantedCollections: ["app.bsky.feed.post"],
});

jetstream.onCreate("app.bsky.feed.post", (event) => {
  if (event.commit.record.embed?.$type === "app.bsky.embed.images") {
    queue
      .add(
        `at://${event.did}/${event.commit.collection}/${event.commit.cid}`,
        event,
        { lifo: true }
      )
      .catch((e) => log(e));
  }
});

jetstream.start();

console.log("Firehose consumer running...");
