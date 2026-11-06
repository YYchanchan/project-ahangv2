import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import type { Animal, User } from "../src/types";

dotenv.config({ path: existsSync(".env") ? ".env" : ".env.development" });
process.env.NODE_ENV = "test";

async function main() {
  const [{ buildApp }, { createSessionToken }, { createStore }] = await Promise.all([
    import("../server"),
    import("../server/security"),
    import("../server/store"),
  ]);
  const store = createStore();
  await store.initialize();
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "project_ahang",
  });

  const suffix = randomUUID();
  const userId = `qa-edit-user-${suffix}`;
  const animalId = `qa-edit-animal-${suffix}`;
  const submissionIds: string[] = [];
  const cleanupTargetIds = [animalId];
  let server: ReturnType<ReturnType<typeof buildApp>["listen"]> | undefined;

  try {
    await connection.execute(
      `INSERT INTO users (id, nickname, avatar_url, role, status)
       VALUES (?, '内容修改测试用户', '', 'contributor', 'active')`,
      [userId],
    );
    const user: User = {
      id: userId,
      nickname: "内容修改测试用户",
      avatarUrl: "",
      role: "contributor",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    const admin = await store.authenticateAdmin(
      process.env.ADMIN_USERNAME || "admin",
      process.env.ADMIN_PASSWORD || "ahang-admin",
    );
    if (!admin) throw new Error("测试管理员登录失败");

    const animal: Animal = {
      id: animalId,
      name: "内容修改测试动物",
      nickname: "",
      species: "African Lion",
      scientificName: "Panthera leo",
      speciesCode: "african-lion",
      image: "",
      imageType: "placeholder",
      status: "deceased",
      institution: "测试机构",
      city: "测试城市",
      gender: "未知",
      lifeSpan: "待核实",
      statusLabel: "已离世",
      tags: [],
      description: "仅用于自动化验证，测试结束后删除。",
      timeline: [],
      observations: [],
      verified: false,
      verifiedCount: 0,
      recordCount: 0,
    };
    await store.saveAnimal(animal, admin.id);

    const createApproved = async (type: "observation" | "memory" | "task", payload: Record<string, unknown>) => {
      const submission = await store.createSubmission(user, {
        type,
        animalId,
        animalName: animal.name,
        title: `${type} 原标题`,
        details: `${type} 原正文`,
        payload,
        source: "自动化测试",
        copyright: "自动化测试授权",
      });
      submissionIds.push(submission.id);
      cleanupTargetIds.push(submission.id);
      const approved = await store.reviewSubmission(submission.id, admin, {
        status: "approved",
        comment: "自动化审核通过",
      });
      if (!approved) throw new Error(`${type} 审核失败`);
      return approved;
    };

    const observation = await createApproved("observation", {
      dateTime: "2026-09-07 10:00",
      location: "测试园区",
      behaviors: ["进食"],
    });
    const memory = await createApproved("memory", { date: "2026-09-07" });
    const task = await createApproved("task", {
      expectedInfo: "原期望资料",
      rewardLabel: "原任务说明",
    });

    server = buildApp(store).listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("测试服务未获得端口");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const token = createSessionToken(admin.id, "admin").token;

    const updateApproved = async (
      id: string,
      title: string,
      details: string,
      payload: Record<string, unknown>,
    ) => {
      const response = await fetch(`${baseUrl}/api/admin/submissions/${id}/content`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animalName: animal.name,
          title,
          details,
          payload,
          source: "修正后的来源",
          copyright: "修正后的授权",
        }),
      });
      if (!response.ok) throw new Error(`修改已通过内容失败：HTTP ${response.status} ${await response.text()}`);
    };

    await updateApproved(observation.id, "观察标题已修正", "观察错别字已修正", {
      dateTime: "2026-09-07 10:30",
      location: "修正后的园区",
      behaviors: ["进食"],
    });
    await updateApproved(observation.id, "观察标题二次修正", "观察正文二次修正", {
      dateTime: "2026-09-07 10:35",
      location: "修正后的园区",
      behaviors: ["进食"],
    });
    const syncedAnimal = await store.getAnimal(animalId);
    const syncedObservations = syncedAnimal?.observations.filter((item) => item.sourceSubmissionId === observation.id) || [];
    if (syncedObservations.length !== 1 || syncedObservations[0].text !== "观察正文二次修正") {
      throw new Error("观察记录修改未正确同步，或产生了重复记录");
    }

    await updateApproved(memory.id, "回忆标题已修正", "回忆正文已修正", { date: "2026-09-08" });
    await updateApproved(memory.id, "回忆标题二次修正", "回忆正文二次修正", { date: "2026-09-09" });
    const [memoryRows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT title, content FROM memories WHERE submission_id = ?",
      [memory.id],
    );
    if (memoryRows.length !== 1 || memoryRows[0].content !== "回忆正文二次修正") {
      throw new Error("公众回忆修改未正确同步，或产生了重复记录");
    }

    await updateApproved(task.id, "任务标题已修正", "任务正文已修正", {
      expectedInfo: "修正后的期望资料",
      rewardLabel: "修正后的任务说明",
    });
    await updateApproved(task.id, "任务标题二次修正", "任务正文二次修正", {
      expectedInfo: "二次修正后的期望资料",
      rewardLabel: "二次修正后的任务说明",
    });
    const [taskRows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT title, description FROM collaboration_tasks WHERE source_submission_id = ?",
      [task.id],
    );
    if (taskRows.length !== 1 || taskRows[0].description !== "任务正文二次修正") {
      throw new Error("协作任务修改未正确同步，或产生了重复记录");
    }

    console.log(JSON.stringify({
      approvedContentEdit: "ok",
      observation: { updated: true, duplicateCount: syncedObservations.length },
      memory: { updated: true, duplicateCount: memoryRows.length },
      task: { updated: true, duplicateCount: taskRows.length },
    }, null, 2));
  } finally {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    if (submissionIds.length) {
      const placeholders = submissionIds.map(() => "?").join(",");
      await connection.execute(`DELETE FROM collaboration_tasks WHERE source_submission_id IN (${placeholders})`, submissionIds).catch(() => undefined);
      await connection.execute(`DELETE FROM memories WHERE submission_id IN (${placeholders})`, submissionIds).catch(() => undefined);
      await connection.execute(`DELETE FROM review_logs WHERE target_id IN (${cleanupTargetIds.map(() => "?").join(",")})`, cleanupTargetIds).catch(() => undefined);
      await connection.execute(`DELETE FROM submissions WHERE id IN (${placeholders})`, submissionIds).catch(() => undefined);
    }
    await connection.execute("DELETE FROM animals WHERE id = ?", [animalId]).catch(() => undefined);
    await connection.execute("DELETE FROM users WHERE id = ?", [userId]).catch(() => undefined);
    await connection.end();
    await store.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
