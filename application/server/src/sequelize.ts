import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Sequelize } from "sequelize";

import { initModels } from "@web-speed-hackathon-2026/server/src/models";
import { DATABASE_PATH } from "@web-speed-hackathon-2026/server/src/paths";

let _sequelize: Sequelize | null = null;

export async function initializeSequelize() {
  const prevSequelize = _sequelize;
  _sequelize = null;
  await prevSequelize?.close();

  const TEMP_PATH = path.resolve(
    await fs.mkdtemp(path.resolve(os.tmpdir(), "./wsh-")),
    "./database.sqlite",
  );
  await fs.copyFile(DATABASE_PATH, TEMP_PATH);

  _sequelize = new Sequelize({
    dialect: "sqlite",
    logging: false,
    storage: TEMP_PATH,
  });
  initModels(_sequelize);

  // SQLiteにインデックスを追加（外部キーにインデックスがないため）
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_user_id ON Posts(userId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_movie_id ON Posts(movieId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_sound_id ON Posts(soundId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_images_post_id ON PostsImagesRelations(postId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_posts_images_image_id ON PostsImagesRelations(imageId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_comments_post_id ON Comments(postId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_comments_user_id ON Comments(userId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_users_profile_image_id ON Users(profileImageId)");
  await _sequelize.query("CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username)");

  // SQLite WALモードで読み取り性能向上
  await _sequelize.query("PRAGMA journal_mode=WAL");
  await _sequelize.query("PRAGMA synchronous=NORMAL");
}
