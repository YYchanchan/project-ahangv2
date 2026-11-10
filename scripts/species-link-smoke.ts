import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import type { Animal, Species } from "../src/types";
import type { SubmissionRecord } from "../server/store-types";

async function main() {
  const dev = dotenv.parse(readFileSync(process.env.AHANG_ENV_FILE || ".env.development"));
  const host = process.env.MYSQL_HOST || dev.MYSQL_HOST || "127.0.0.1";
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(host), "此测试仅使用本地 MySQL");
  const database = `ahang_species_test_${randomUUID().replace(/-/g, "")}`;
  const config = {
    host,
    port: Number(process.env.MYSQL_PORT || dev.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || dev.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD ?? dev.MYSQL_PASSWORD ?? "",
  };
  const connection = await mysql.createConnection(config);
  const logPrefix = path.join(tmpdir(), "ahang-species-link-");
  const logs = await mkdtemp(logPrefix);
  Object.assign(process.env, {
    NODE_ENV: "test",
    LOG_DIR: logs,
    DATABASE_URL: "",
    MYSQL_HOST: config.host,
    MYSQL_PORT: String(config.port),
    MYSQL_USER: config.user,
    MYSQL_PASSWORD: config.password,
    MYSQL_DATABASE: database,
  });
  const { buildApp } = await import("../server");
  const { createStore } = await import("../server/store");
  const { createSessionToken } = await import("../server/security");
  const store = createStore();
  let server: ReturnType<ReturnType<typeof buildApp>["listen"]> | undefined;
  let created = false;

  try {
    await connection.query("CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", [database]);
    created = true;
    await store.initialize();
    const reviewer = await store.authenticateAdmin(
      process.env.ADMIN_USERNAME || "admin",
      process.env.ADMIN_PASSWORD || "ahang-admin",
    );
    assert.ok(reviewer);
    const contributor = await store.upsertWechatUser({ openid: "qa-species-link", nickname: "测试观察员" });
    const contributorToken = createSessionToken(contributor.id, "weixin", "mp-weixin").token;
    const reviewerToken = createSessionToken(reviewer.id, "admin").token;
    const species: Species = {
      id: "african-lion",
      biologicalProfile: {
        chineseName: "非洲狮", englishName: "African Lion", latinName: "Panthera leo", kingdom: "Animalia",
        phylum: "Chordata", className: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Panthera",
        species: "Panthera leo",
      },
      basicInfo: {
        captiveLifespan: "", weight: "", sizeHeight: "", diet: "", socialStructure: "", activityTime: "",
        reproduction: "", distribution: "", habitat: "", iucnStatus: "", citesStatus: "",
      },
      characteristics: [{ title: "群居", description: "物种资料测试内容" }],
      faqs: [],
      extendedReading: { congeneric: [], confamilial: [], articles: [], courses: [], videos: [], creativeProducts: [] },
      wildVsZoo: [{ title: "食物来源", wild: "野外资料", zoo: "动物园资料" }],
    };
    await store.saveSpecies(species, reviewer.id);
    await store.saveSpecies({ ...species, id: "other-species" }, reviewer.id);
    const candidate: Animal = {
      id: "candidate-qa", name: "得得", nickname: "", species: "待核实大猫", scientificName: "", speciesCode: "",
      image: "", imageType: "placeholder", status: "need_info", institution: "测试机构", city: "测试城市",
      gender: "雄性", lifeSpan: "待核实", statusLabel: "待补充", tags: [], description: "候选个体自己的资料",
      timeline: [], observations: [], verified: false, verifiedCount: 0,
    };
    await store.saveAnimal({
      ...candidate, id: "reference-qa", name: "参考个体", speciesCode: species.id,
      gender: "雌性", description: "参考个体的私有经历",
    }, reviewer.id);

    server = buildApp(store).listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const request = async <T>(endpoint: string, status: number, method = "GET", body?: unknown, token?: string) => {
      const response = await fetch(`http://127.0.0.1:${address.port}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await response.json();
      assert.equal(response.status, status, JSON.stringify(data));
      return data as T;
    };
    const submit = (body: unknown, status = 201, token = contributorToken) =>
      request<{ submission: SubmissionRecord }>("/api/submissions", status, "POST", body, token);
    const review = (id: string, token = reviewerToken) =>
      request(`/api/admin/submissions/${id}/review`, token === reviewerToken ? 200 : 403, "PUT", {
        status: "approved", comment: "测试审核通过",
      }, token);
    const readCandidate = async () => (await request<{ animal: Animal }>(`/api/animals/${candidate.id}`, 200)).animal;

    const recommendation = {
      type: "recommend", title: "新增候选动物", details: "候选档案测试", animalName: candidate.name,
      payload: { animal: candidate },
    };
    const { submission: createdRecommendation } = await submit(recommendation);
    await review(createdRecommendation.id);

    const correction = {
      type: "correction", title: "关联已有物种资料", details: "测试资料与参考个体",
      animalId: ` ${candidate.id} `, animalName: "客户端旧名称",
      payload: { field: "species_link", speciesId: " african-lion ", referenceAnimalId: " reference-qa " },
    };
    await submit(correction, 401, "");
    await submit({ ...correction, payload: { ...correction.payload, speciesId: "missing" } }, 400);
    await submit({ ...correction, payload: { ...correction.payload, speciesId: "other-species" } }, 400);
    const { submission } = await submit(correction);
    assert.equal(submission.status, "pending");
    assert.equal(submission.animalId, candidate.id);
    assert.equal(submission.animalName, candidate.name);
    assert.equal(submission.payload.speciesId, species.id);
    assert.equal(submission.payload.referenceAnimalId, "reference-qa");
    await review(submission.id, contributorToken);
    assert.equal((await readCandidate()).speciesCode, "");

    await review(submission.id);
    await review(submission.id);
    const approved = await readCandidate();
    assert.equal(approved.speciesCode, species.id);
    assert.equal(approved.speciesId, species.id);
    assert.equal(approved.scientificName, species.biologicalProfile.latinName);
    assert.equal(approved.species, candidate.species);
    assert.equal(approved.gender, candidate.gender);
    assert.equal(approved.description, candidate.description);
    assert.deepEqual(approved.supplements?.map((item) => item.sourceSubmissionId), [submission.id]);
    assert.deepEqual((await request<{ species: Species }>(`/api/species/${approved.speciesCode}`, 200)).species, species);
    await assert.rejects(store.deleteSpecies(species.id, reviewer.id), /仍被动物档案引用/);

    await request(`/api/admin/submissions/${createdRecommendation.id}/content`, 200, "PUT", {
      ...recommendation, title: "修改已审核的推荐",
    }, reviewerToken);
    const afterEdit = await readCandidate();
    assert.equal(afterEdit.speciesCode, species.id);
    assert.deepEqual(afterEdit.supplements, approved.supplements);

    const { submission: stale } = await submit({
      ...correction, payload: { field: "species_link", speciesId: "other-species" },
    });
    assert.equal(await store.deleteSpecies("other-species", reviewer.id), true);
    await assert.rejects(store.reviewSubmission(stale.id, reviewer, { status: "approved", comment: "失效资料" }), /尚未公开/);
    assert.equal((await store.listUserSubmissions(contributor.id)).find((item) => item.id === stale.id)?.status, "pending");
    assert.equal((await readCandidate()).speciesCode, species.id);
    console.log("物种关联冒烟测试通过");
  } finally {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await store.close();
    if (created) await connection.query("DROP DATABASE ??", [database]);
    await connection.end();
    if (path.resolve(logs).startsWith(path.resolve(logPrefix))) await rm(logs, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
