import Bluebird from "bluebird";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

/** 辞書の二重読み込みを避け、kuromoji をアプリ全体で1回だけ初期化する */
export function getKuromojiTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerPromise === null) {
    tokenizerPromise = (async () => {
      const builder = Bluebird.promisifyAll(kuromoji.builder({ dicPath: "/dicts" }));
      return builder.buildAsync();
    })();
  }
  return tokenizerPromise;
}
