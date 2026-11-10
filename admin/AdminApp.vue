<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { Animal, PublicMemoryRecord, Species, TaskChallenge, User, UserRole, UserStatus } from "../src/types";
import {
  isUncertainSpeciesCode,
  resolveSpecies,
  speciesLinkFields,
  uncertainSpeciesFields,
  UNCERTAIN_SPECIES_CODE,
} from "../src/data/speciesResolver";
import AdminIcon from "./AdminIcon.vue";
import SpeciesEditor from "./SpeciesEditor.vue";

type TabId = "review" | "animals" | "species" | "memories" | "tasks" | "users" | "logs";
type SubmissionType = "recommend" | "observation" | "memory" | "correction" | "archive" | "task" | "supplement";
type SubmissionStatus = "pending" | "approved" | "need_supplement" | "rejected";

interface LoginResponse { token: string; user: User }
interface Submission {
  id: string;
  userId: string;
  submitterName: string;
  type: SubmissionType;
  animalId?: string;
  animalName: string;
  title: string;
  details: string;
  payload: Record<string, unknown>;
  mediaUrl?: string;
  source?: string;
  copyright?: string;
  status: SubmissionStatus;
  statusLabel: string;
  adminComment: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
}
interface Stats { pending: number; today: number; approvedThisMonth: number; animalCount: number }
interface ReviewLog { id: string; operator: string; action: string; targetType: string; targetId: string; createdAt: string }
interface LogDetailField { label: string; value: string }
interface LogTargetDetail {
  title: string;
  description?: string;
  imageUrl?: string;
  fields: LogDetailField[];
  payloadEntries?: Array<{ key: string; label: string; value: string }>;
}

const TOKEN_KEY = "ahang_admin_token";
const currentUser = ref<User | null>(null);
const token = ref(localStorage.getItem(TOKEN_KEY) || "");
const loading = ref(false);
const loginLoading = ref(false);
const activeTab = ref<TabId>("review");
const toast = ref("");
const errorMessage = ref("");
const stats = ref<Stats>({ pending: 0, today: 0, approvedThisMonth: 0, animalCount: 0 });
const submissions = ref<Submission[]>([]);
const animals = ref<Animal[]>([]);
const species = ref<Species[]>([]);
const memories = ref<PublicMemoryRecord[]>([]);
const tasks = ref<TaskChallenge[]>([]);
const users = ref<User[]>([]);
const logs = ref<ReviewLog[]>([]);
const search = ref("");
const typeFilter = ref<SubmissionType | "all">("all");
const statusFilter = ref<SubmissionStatus | "all">("pending");
const reviewTarget = ref<Submission | null>(null);
const selectedLog = ref<ReviewLog | null>(null);
const editingApprovedSubmission = ref<Submission | null>(null);
const approvedPayloadText = ref("");
const approvedEditError = ref("");
const approvedEditSaving = ref(false);
const reviewDecision = ref<Exclude<SubmissionStatus, "pending">>("approved");
const reviewComment = ref("");
const reviewError = ref("");
const reviewSubmitting = ref(false);
const editingAnimal = ref<Animal | null>(null);
const editingSpecies = ref<Species | null>(null);
const speciesEditorIsNew = ref(false);
const speciesEditorRef = ref<{ commitLists: () => void } | null>(null);
const editingMemory = ref<PublicMemoryRecord | null>(null);
const editingTask = ref<TaskChallenge | null>(null);
const imageUploading = ref(false);
const loginForm = reactive({ username: "", password: "" });
let toastTimer: number | undefined;

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "review", label: "审核中心", icon: "review" },
  { id: "animals", label: "动物档案", icon: "animal" },
  { id: "species", label: "物种知识", icon: "book" },
  { id: "memories", label: "公众回忆", icon: "review" },
  { id: "tasks", label: "协作任务", icon: "log" },
  { id: "users", label: "用户管理", icon: "users" },
  { id: "logs", label: "审核日志", icon: "log" },
];

const typeLabels: Record<SubmissionType, string> = {
  recommend: "推荐建档",
  observation: "观察记录",
  memory: "纪念回忆",
  correction: "纠错补充",
  archive: "历史资料",
  task: "协作任务",
  supplement: "补充资料",
};

const reviewDecisionOptions: Array<{
  value: Exclude<SubmissionStatus, "pending">;
  label: string;
  description: string;
}> = [
  { value: "approved", label: "审核通过", description: "通过后发布到用户端公开页面" },
  { value: "need_supplement", label: "要求补充", description: "反馈给提交者，等待补充材料" },
  { value: "rejected", label: "退回内容", description: "不予公开，并说明退回原因" },
];

const payloadLabels: Record<string, string> = {
  dateTime: "观察时间",
  location: "观察地点",
  behaviors: "行为标签",
  description: "补充说明",
  animal: "推荐档案资料",
  citation: "引用或佐证",
  date: "资料日期",
  field: "纠错字段",
  evidence: "纠错依据",
  speciesId: "拟关联物种",
  referenceAnimalId: "参考已有个体",
  text: "拟公开的补充内容",
  expectedInfo: "希望获得的资料",
  rewardLabel: "协作奖励说明",
  taskId: "协作任务 ID",
  taskTitle: "协作任务标题",
  fields: "补充的个体字段",
  relatedSubmissionId: "关联投稿",
  missingAtSubmit: "提交时缺少的字段",
};

function formatPayloadValue(key: string, value: unknown): string {
  if (typeof value === "string") {
    if (key === "field" && value === "species_link") return "关联已有物种资料";
    if (key === "speciesId") {
      const profile = species.value.find((item) => item.id === value)?.biologicalProfile;
      if (profile) return `${profile.chineseName} · ${profile.latinName}（${value}）`;
    }
    if (key === "referenceAnimalId") {
      const animal = animals.value.find((item) => item.id === value);
      if (animal) return `${animal.name} · ${animal.species} · ${animal.gender}（${value}）`;
    }
    return value;
  }
  return Array.isArray(value) ? value.join("、") : JSON.stringify(value, null, 2);
}

function toPayloadEntries(payload: Record<string, unknown> = {}) {
  return Object.entries(payload).map(([key, value]) => ({
    key,
    label: payloadLabels[key] || key,
    value: formatPayloadValue(key, value),
  }));
}

const reviewPayloadEntries = computed(() => toPayloadEntries(reviewTarget.value?.payload));

const logTargetTypeLabels: Record<string, string> = {
  submission: "用户投稿",
  animal: "动物档案",
  species: "物种知识",
  memory: "公众回忆",
  task: "协作任务",
  user: "用户账号",
};

const selectedLogSubmission = computed(() =>
  selectedLog.value?.targetType === "submission"
    ? submissions.value.find((item) => item.id === selectedLog.value?.targetId) || null
    : null,
);

const selectedLogDetail = computed<LogTargetDetail | null>(() => {
  const log = selectedLog.value;
  if (!log) return null;

  if (log.targetType === "submission") {
    const item = submissions.value.find((entry) => entry.id === log.targetId);
    return item ? {
      title: item.title,
      description: item.details,
      imageUrl: item.mediaUrl,
      fields: [
        { label: "投稿类型", value: typeLabels[item.type] },
        { label: "提交者", value: `${item.submitterName}（${item.userId}）` },
        { label: "关联动物", value: item.animalName || item.animalId || "未绑定档案" },
        { label: "当前状态", value: item.statusLabel },
        { label: "提交时间", value: formatTime(item.submittedAt) },
        { label: "审核时间", value: item.reviewedAt ? formatTime(item.reviewedAt) : "尚未审核" },
        { label: "版权与授权", value: item.copyright || "未填写" },
        { label: "资料来源", value: item.source || "未填写" },
        { label: "审核反馈", value: item.adminComment || "暂无反馈" },
      ],
      payloadEntries: toPayloadEntries(item.payload),
    } : null;
  }

  if (log.targetType === "animal") {
    const item = animals.value.find((entry) => entry.id === log.targetId);
    return item ? {
      title: item.name,
      description: item.description || item.summary,
      imageUrl: item.image,
      fields: [
        { label: "物种", value: item.species },
        { label: "状态", value: item.statusLabel },
        { label: "机构", value: item.institution || "未填写" },
        { label: "城市", value: item.city || "未填写" },
        { label: "学名", value: item.scientificName || "未填写" },
        { label: "观察记录", value: `${item.recordCount || item.observations.length} 条` },
      ],
    } : null;
  }

  if (log.targetType === "species") {
    const item = species.value.find((entry) => entry.id === log.targetId);
    return item ? {
      title: item.biologicalProfile.chineseName,
      description: item.basicInfo.habitat,
      fields: [
        { label: "英文名", value: item.biologicalProfile.englishName || "未填写" },
        { label: "拉丁名", value: item.biologicalProfile.latinName || "未填写" },
        { label: "食性", value: item.basicInfo.diet || "未填写" },
        { label: "分布", value: item.basicInfo.distribution || "未填写" },
        { label: "IUCN", value: item.basicInfo.iucnStatus || "未填写" },
        { label: "CITES", value: item.basicInfo.citesStatus || "未填写" },
      ],
    } : null;
  }

  if (log.targetType === "memory") {
    const item = memories.value.find((entry) => entry.id === log.targetId);
    return item ? {
      title: item.title,
      description: item.text,
      imageUrl: item.image,
      fields: [
        { label: "作者", value: item.author || "未填写" },
        { label: "日期", value: item.date || "未填写" },
        { label: "关联动物", value: item.animalIds.join("、") || "未关联" },
        { label: "分类", value: item.categoryLabel || item.category },
        { label: "点赞数", value: String(item.likes || 0) },
      ],
    } : null;
  }

  if (log.targetType === "task") {
    const item = tasks.value.find((entry) => entry.id === log.targetId);
    return item ? {
      title: item.title,
      description: item.description,
      fields: [
        { label: "关联动物", value: item.animalName || item.animalId || "不限" },
        { label: "发起者", value: item.creatorName || "未填写" },
        { label: "期望资料", value: item.expectedInfo || "未填写" },
        { label: "任务回报", value: item.rewardLabel || "未填写" },
        { label: "当前进度", value: item.progressText || "未填写" },
        { label: "贡献数", value: String(item.contributionCount || 0) },
      ],
    } : null;
  }

  if (log.targetType === "user") {
    const item = users.value.find((entry) => entry.id === log.targetId);
    return item ? {
      title: item.nickname,
      imageUrl: item.avatarUrl,
      fields: [
        { label: "用户 ID", value: item.id },
        { label: "角色", value: item.role },
        { label: "状态", value: item.status },
        { label: "注册时间", value: formatTime(item.createdAt) },
        { label: "最近登录", value: item.lastLoginAt ? formatTime(item.lastLoginAt) : "暂无" },
      ],
    } : null;
  }

  return null;
});

const filteredSubmissions = computed(() => {
  const query = search.value.trim().toLowerCase();
  return submissions.value.filter((item) =>
    (typeFilter.value === "all" || item.type === typeFilter.value) &&
    (statusFilter.value === "all" || item.status === statusFilter.value) &&
    (!query || [item.title, item.animalName, item.submitterName].join(" ").toLowerCase().includes(query)),
  );
});

const filteredAnimals = computed(() => {
  const query = search.value.trim().toLowerCase();
  return animals.value.filter((item) => !query || [item.name, item.nickname, item.species, item.institution, item.city].join(" ").toLowerCase().includes(query));
});

const filteredSpecies = computed(() => {
  const query = search.value.trim().toLowerCase();
  return species.value.filter((item) => {
    const profile = item.biologicalProfile;
    return !query || [profile.chineseName, profile.englishName, profile.latinName].join(" ").toLowerCase().includes(query);
  });
});

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase();
  return users.value.filter((item) => !query || `${item.nickname} ${item.id}`.toLowerCase().includes(query));
});

const filteredMemories = computed(() => {
  const query = search.value.trim().toLowerCase();
  return memories.value.filter((item) => !query || [item.title, item.author, item.text].join(" ").toLowerCase().includes(query));
});

const filteredTasks = computed(() => {
  const query = search.value.trim().toLowerCase();
  return tasks.value.filter((item) => !query || [item.title, item.description, item.animalName].join(" ").toLowerCase().includes(query));
});

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function formatTime(value: string) { return value ? value.replace("T", " ").slice(0, 16) : "--"; }
function showToast(message: string) {
  toast.value = message;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.value = ""; }, 2600);
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) {
    if (response.status === 401 && token.value) logout(false);
    throw new Error(body.error || `请求失败（${response.status}）`);
  }
  return body;
}

function resolveAdminMediaUrl(source?: string): string {
  if (!source) return "";
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  return new URL(source, window.location.origin).href;
}

async function uploadAdminImage(event: Event, target: "animal" | "memory") {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  imageUploading.value = true;
  errorMessage.value = "";
  try {
    const form = new FormData();
    form.append("file", file);
    const result = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
    if (target === "animal" && editingAnimal.value) {
      const previousImage = editingAnimal.value.image;
      const gallery = [...(editingAnimal.value.gallery || [])];
      const previousIndex = gallery.indexOf(previousImage);
      if (previousIndex >= 0) gallery[previousIndex] = result.url;
      else gallery.unshift(result.url);
      editingAnimal.value.image = result.url;
      editingAnimal.value.coverUrl = result.url;
      editingAnimal.value.gallery = [...new Set(gallery.filter(Boolean))];
      editingAnimal.value.imageType = "official_photo";
    }
    if (target === "memory" && editingMemory.value) editingMemory.value.image = result.url;
    showToast("图片已上传到服务器 uploads，保存内容后同步到用户端");
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "图片上传失败";
  } finally {
    imageUploading.value = false;
    input.value = "";
  }
}

async function login() {
  if (!loginForm.username.trim() || !loginForm.password) {
    errorMessage.value = "请输入管理员账号和密码";
    return;
  }
  loginLoading.value = true;
  errorMessage.value = "";
  try {
    const result = await api<LoginResponse>("/api/auth/admin", {
      method: "POST",
      body: JSON.stringify(loginForm),
    });
    token.value = result.token;
    localStorage.setItem(TOKEN_KEY, result.token);
    currentUser.value = result.user;
    loginForm.password = "";
    await loadAll();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "登录失败";
  } finally {
    loginLoading.value = false;
  }
}

function logout(notify = true) {
  token.value = "";
  currentUser.value = null;
  localStorage.removeItem(TOKEN_KEY);
  if (notify) showToast("已安全退出管理后台");
}

async function loadAll() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const userRequest = currentUser.value?.role === "admin"
      ? api<{ items: User[] }>("/api/admin/users")
      : Promise.resolve({ items: [] as User[] });
    const [statsResult, submissionResult, animalResult, speciesResult, memoryResult, taskResult, userResult, logResult] = await Promise.all([
      api<{ stats: Stats }>("/api/admin/stats"),
      api<{ items: Submission[] }>("/api/admin/submissions"),
      api<{ items: Animal[] }>("/api/admin/animals"),
      api<{ items: Species[] }>("/api/admin/species"),
      api<{ items: PublicMemoryRecord[] }>("/api/admin/memories"),
      api<{ items: TaskChallenge[] }>("/api/admin/tasks"),
      userRequest,
      api<{ items: ReviewLog[] }>("/api/admin/logs"),
    ]);
    stats.value = statsResult.stats;
    submissions.value = submissionResult.items;
    animals.value = animalResult.items;
    species.value = speciesResult.items;
    memories.value = memoryResult.items;
    tasks.value = taskResult.items;
    users.value = userResult.items;
    logs.value = logResult.items;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "管理数据加载失败";
  } finally {
    loading.value = false;
  }
}

function selectTab(id: TabId) {
  activeTab.value = id;
  search.value = "";
  errorMessage.value = "";
}

function defaultReviewComment(decision: Exclude<SubmissionStatus, "pending">): string {
  return decision === "approved"
    ? "资料核验通过，现已公开。"
    : decision === "need_supplement"
      ? "请补充可核对的时间、地点、拍摄原图或公开来源。"
      : "资料不符合公开收录标准，已退回。";
}

function openReview(item: Submission) {
  reviewTarget.value = item;
  reviewDecision.value = item.status === "pending" ? "approved" : item.status;
  reviewComment.value = item.status === "pending"
    ? defaultReviewComment("approved")
    : item.adminComment || defaultReviewComment(reviewDecision.value);
  reviewError.value = "";
}

function openReviewFromLog() {
  const submission = selectedLogSubmission.value;
  if (!submission) return;
  selectedLog.value = null;
  openReview(submission);
}

function openApprovedSubmissionEditor(item: Submission) {
  if (item.status !== "approved") return;
  editingApprovedSubmission.value = clone(item);
  approvedPayloadText.value = JSON.stringify(item.payload || {}, null, 2);
  approvedEditError.value = "";
}

async function saveApprovedSubmission() {
  const draft = editingApprovedSubmission.value;
  if (!draft) return;
  if (!draft.title.trim() || !draft.details.trim()) {
    approvedEditError.value = "标题和正文不能为空。";
    return;
  }
  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(approvedPayloadText.value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    payload = parsed as Record<string, unknown>;
  } catch {
    approvedEditError.value = "表单信息必须是正确的 JSON 对象。";
    return;
  }

  approvedEditSaving.value = true;
  approvedEditError.value = "";
  try {
    const result = await api<{ submission: Submission }>(`/api/admin/submissions/${draft.id}/content`, {
      method: "PUT",
      body: JSON.stringify({
        animalName: draft.animalName,
        title: draft.title,
        details: draft.details,
        payload,
        mediaUrl: draft.mediaUrl || "",
        source: draft.source || "",
        copyright: draft.copyright || "",
      }),
    });
    const index = submissions.value.findIndex((item) => item.id === result.submission.id);
    if (index >= 0) submissions.value[index] = result.submission;
    reviewTarget.value = result.submission;
    editingApprovedSubmission.value = null;
    showToast("已通过内容已修改，并同步更新公开端数据");
    await loadAll();
  } catch (error) {
    approvedEditError.value = error instanceof Error ? error.message : "修改失败，请稍后重试";
  } finally {
    approvedEditSaving.value = false;
  }
}

function selectReviewDecision(decision: Exclude<SubmissionStatus, "pending">) {
  const previousDefault = defaultReviewComment(reviewDecision.value);
  reviewDecision.value = decision;
  if (!reviewComment.value.trim() || reviewComment.value === previousDefault) {
    reviewComment.value = defaultReviewComment(decision);
  }
  reviewError.value = "";
}

async function submitReview() {
  if (!reviewTarget.value) return;
  const comment = reviewComment.value.trim();
  if (!comment) {
    reviewError.value = "请填写审核反馈，提交者将在“我的投稿”中看到这段内容。";
    return;
  }
  reviewSubmitting.value = true;
  reviewError.value = "";
  try {
    const result = await api<{ submission: Submission }>(`/api/admin/submissions/${reviewTarget.value.id}/review`, {
      method: "PUT",
      body: JSON.stringify({ status: reviewDecision.value, comment }),
    });
    const index = submissions.value.findIndex((item) => item.id === result.submission.id);
    if (index >= 0) submissions.value[index] = result.submission;
    showToast(reviewDecision.value === "approved" ? "审核通过，内容已同步公开" : "审核结果和反馈已保存");
    reviewTarget.value = null;
    await loadAll();
  } catch (error) {
    reviewError.value = error instanceof Error ? error.message : "审核失败，请稍后重试";
  } finally {
    reviewSubmitting.value = false;
  }
}

const animalSpeciesQuery = ref("");

const animalSpeciesOptions = computed(() => {
  const query = animalSpeciesQuery.value.trim().toLowerCase();
  const selectedId = editingAnimal.value?.speciesCode;
  return species.value.filter((item) => {
    if (item.id === selectedId) return true;
    if (!query) return true;
    const profile = item.biologicalProfile;
    return [profile.chineseName, profile.englishName, profile.latinName, ...(item.aliases || [])]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
});

function applyAdminSpeciesLink() {
  const animal = editingAnimal.value;
  if (!animal) return;
  if (isUncertainSpeciesCode(animal.speciesCode)) {
    Object.assign(animal, uncertainSpeciesFields());
    return;
  }
  const picked = species.value.find((item) => item.id === animal.speciesCode);
  if (picked) Object.assign(animal, speciesLinkFields(picked));
}

function beginEditAnimal(item: Animal) {
  const copy = clone(item);
  if (!copy.speciesCode || isUncertainSpeciesCode(copy.speciesCode)) {
    const matched = resolveSpecies(species.value, copy);
    if (matched) Object.assign(copy, speciesLinkFields(matched));
  }
  animalSpeciesQuery.value = "";
  editingAnimal.value = copy;
}

async function saveAnimal() {
  applyAdminSpeciesLink();
  if (!editingAnimal.value?.id.trim() || !editingAnimal.value.name.trim()) return;
  if (!editingAnimal.value.speciesCode) {
    errorMessage.value = "请从物种库选择物种，或标记为不确定 / 待核实";
    return;
  }
  loading.value = true;
  try {
    await api(`/api/admin/animals/${encodeURIComponent(editingAnimal.value.id)}`, { method: "PUT", body: JSON.stringify({ animal: editingAnimal.value }) });
    editingAnimal.value = null;
    showToast("动物档案已保存并同步到用户端");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

function speciesSlug(species: Species): string {
  const fromEnglish = species.biologicalProfile.englishName
    .trim()
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return fromEnglish || `species-${Date.now()}`;
}

function emptySpecies(): Species {
  return {
    id: "",
    aliases: [],
    biologicalProfile: { chineseName: "", englishName: "", latinName: "", kingdom: "", phylum: "", className: "", order: "", family: "", genus: "", species: "" },
    basicInfo: { wildLifespan: "", captiveLifespan: "", weight: "", sizeHeight: "", diet: "", socialStructure: "", activityTime: "", reproduction: "", distribution: "", habitat: "", iucnStatus: "", citesStatus: "" },
    characteristics: [],
    faqs: [],
    extendedReading: { congeneric: [], confamilial: [], articles: [], courses: [], videos: [], creativeProducts: [] },
    wildVsZoo: [],
    coverImage: "",
    imageCredit: { author: "", license: "", sourceUrl: "" },
  };
}

function linkedAnimalCount(speciesId: string): number {
  return animals.value.filter((animal) => animal.speciesCode === speciesId).length;
}

async function saveSpecies() {
  const species = editingSpecies.value;
  if (!species) return;
  speciesEditorRef.value?.commitLists();
  if (!species.biologicalProfile.chineseName.trim()) {
    errorMessage.value = "请填写物种中文名。物种可以先单独创建，不必等有个体。";
    return;
  }
  if (!species.biologicalProfile.latinName.trim()) species.biologicalProfile.latinName = species.biologicalProfile.species.trim();
  if (!species.id.trim()) species.id = speciesSlug(species);
  species.characteristics = species.characteristics.filter((item) => item.title.trim() && item.description.trim());
  species.faqs = species.faqs.filter((item) => item.q.trim() && item.a.trim());
  species.wildVsZoo = (species.wildVsZoo || []).filter((item) => item.title.trim() && (item.wild.trim() || item.zoo.trim()));
  loading.value = true;
  errorMessage.value = "";
  try {
    await api(`/api/admin/species/${encodeURIComponent(species.id)}`, { method: "PUT", body: JSON.stringify({ species }) });
    editingSpecies.value = null;
    showToast("物种科普已保存。关联到该物种的每只个体都会显示这份内容");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

async function saveMemory() {
  if (!editingMemory.value?.id.trim() || !editingMemory.value.title.trim()) return;
  loading.value = true;
  try {
    const memory = { ...editingMemory.value, animalIds: editingMemory.value.animalIds.filter(Boolean) };
    await api(`/api/admin/memories/${encodeURIComponent(memory.id)}`, { method: "PUT", body: JSON.stringify({ memory }) });
    editingMemory.value = null;
    showToast("公众回忆已保存并同步到用户端");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

async function saveTask() {
  if (!editingTask.value?.id.trim() || !editingTask.value.title.trim()) return;
  loading.value = true;
  try {
    await api(`/api/admin/tasks/${encodeURIComponent(editingTask.value.id)}`, { method: "PUT", body: JSON.stringify({ task: editingTask.value }) });
    editingTask.value = null;
    showToast("协作任务已保存并同步到用户端");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

async function deleteContent(kind: "animals" | "species" | "memories" | "tasks", id: string, name: string) {
  if (!window.confirm(`确定删除“${name}”吗？此操作会同步到用户端。`)) return;
  loading.value = true;
  try {
    await api(`/api/admin/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast("内容已从 MySQL 删除");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "删除失败"; }
  finally { loading.value = false; }
}

function createAnimal() {
  animalSpeciesQuery.value = "";
  editingAnimal.value = {
    id: "", name: "", nickname: "", species: "待核实物种", scientificName: "", speciesCode: UNCERTAIN_SPECIES_CODE, commonName: "不确定/待核实", englishName: "", image: "",
    imageType: "placeholder", status: "need_info", institution: "", city: "", gender: "未知",
    lifeSpan: "待核实", statusLabel: "待补充", tags: [], description: "", timeline: [], observations: [],
    verified: false, verifiedCount: 0, summary: "", recordCount: 0,
  };
}

function createSpecies() {
  speciesEditorIsNew.value = true;
  editingSpecies.value = emptySpecies();
}

function beginEditSpecies(item: Species) {
  speciesEditorIsNew.value = false;
  editingSpecies.value = clone(item);
  if (!editingSpecies.value.wildVsZoo) editingSpecies.value.wildVsZoo = [];
  if (!editingSpecies.value.aliases) editingSpecies.value.aliases = [];
  if (!editingSpecies.value.imageCredit) editingSpecies.value.imageCredit = { author: "", license: "", sourceUrl: "" };
  if (!editingSpecies.value.basicInfo.wildLifespan) editingSpecies.value.basicInfo.wildLifespan = "";
}

function createMemory() {
  editingMemory.value = { id: "", animalIds: [], title: "", author: "", date: "", text: "", category: "reminiscence", categoryLabel: "回忆", likes: 0, hasLiked: false };
}

function createTask() {
  editingTask.value = { id: "", title: "", description: "", rewardLabel: "共同完善动物档案", progressText: "等待第一条有效线索", actionText: "提供线索", expectedInfo: "", creatorName: currentUser.value?.nickname || "管理后台", contributionCount: 0 };
}

async function updateUser(item: User, update: { role?: UserRole; status?: UserStatus }) {
  loading.value = true;
  try {
    await api(`/api/admin/users/${item.id}`, { method: "PUT", body: JSON.stringify(update) });
    showToast(`${item.nickname} 的权限已更新`);
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "更新失败"; }
  finally { loading.value = false; }
}

onMounted(async () => {
  if (!token.value) return;
  try {
    const result = await api<{ user: User }>("/api/auth/me");
    if (!['reviewer', 'admin'].includes(result.user.role)) throw new Error("当前账号没有管理权限");
    currentUser.value = result.user;
    await loadAll();
  } catch (error) {
    logout(false);
    errorMessage.value = error instanceof Error ? error.message : "登录已失效";
  }
});
</script>

<template>
  <main v-if="!currentUser" class="login-page">
    <section class="login-card">
      <div class="brand-lockup"><span>PROJECT AHANG</span><strong>阿杭计划</strong></div>
      <div class="login-shield"><AdminIcon name="review" :size="30" /></div>
      <h1>管理后台</h1>
      <p>内容审核、动物档案与物种知识统一管理</p>
      <label><span>管理员账号</span><input v-model="loginForm.username" autocomplete="username" placeholder="请输入账号" /></label>
      <label><span>密码</span><input v-model="loginForm.password" type="password" autocomplete="current-password" placeholder="请输入密码" @keyup.enter="login" /></label>
      <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>
      <button class="primary-button" :disabled="loginLoading" @click="login">{{ loginLoading ? "正在登录…" : "登录管理后台" }}</button>
      <small>审核操作将写入操作日志。管理站与公众端相互独立。</small>
    </section>
  </main>

  <div v-else class="admin-shell">
    <aside class="sidebar">
      <div class="sidebar-brand"><span>PROJECT AHANG</span><strong>阿杭计划</strong></div>
      <div class="admin-identity"><div class="admin-avatar">{{ currentUser.nickname.charAt(0) }}</div><div><strong>{{ currentUser.nickname }}</strong><span>{{ currentUser.role === 'admin' ? '管理员' : '审核员' }}</span></div></div>
      <nav aria-label="管理目录">
        <button v-for="item in tabs" :key="item.id" :class="{ active: activeTab === item.id }" @click="selectTab(item.id)"><AdminIcon :name="item.icon" :size="19" /><span>{{ item.label }}</span><em v-if="item.id === 'review' && stats.pending">{{ stats.pending }}</em></button>
      </nav>
      <button class="logout-button" @click="logout()"><AdminIcon name="logout" :size="19" /><span>退出登录</span></button>
    </aside>

    <section class="workspace">
      <header class="workspace-header"><div><h1>{{ tabs.find((item) => item.id === activeTab)?.label }}</h1><p>阿杭计划 / {{ tabs.find((item) => item.id === activeTab)?.label }}</p></div><button class="refresh-button" :disabled="loading" @click="loadAll"><AdminIcon name="refresh" :size="17" />刷新数据</button></header>
      <div v-if="errorMessage" class="page-error">{{ errorMessage }}</div>

      <template v-if="activeTab === 'review'">
        <div class="stats-grid"><article><span>待审核内容</span><strong class="danger">{{ stats.pending }}</strong></article><article><span>今日新增</span><strong>{{ stats.today }}</strong></article><article><span>已通过（本月）</span><strong>{{ stats.approvedThisMonth }}</strong></article><article><span>档案总数</span><strong>{{ stats.animalCount }}</strong></article></div>
        <div class="filter-bar"><label><span>内容类型</span><select v-model="typeFilter"><option value="all">全部类型</option><option v-for="(label, id) in typeLabels" :key="id" :value="id">{{ label }}</option></select></label><label><span>提交状态</span><select v-model="statusFilter"><option value="all">全部状态</option><option value="pending">待审核</option><option value="need_supplement">需补充</option><option value="approved">已通过</option><option value="rejected">已退回</option></select></label><label class="search-control"><span>动物或提交者</span><div><AdminIcon name="search" :size="16" /><input v-model="search" placeholder="搜索动物、标题或提交者" /></div></label><button class="query-button">查询</button></div>
        <div class="table-panel">
          <table><thead><tr><th>类型</th><th>动物 / 内容</th><th>提交者</th><th>提交时间</th><th>版权 / 来源</th><th>状态</th><th>操作</th></tr></thead><tbody>
            <tr
              v-for="item in filteredSubmissions"
              :key="item.id"
              class="review-row"
              tabindex="0"
              :aria-label="`查看并审核：${item.title}`"
              @click="openReview(item)"
              @keyup.enter="openReview(item)"
            >
              <td><span class="type-tag">{{ typeLabels[item.type] }}</span></td>
              <td><strong>{{ item.title }}</strong><span>{{ item.animalName }}</span></td>
              <td>{{ item.submitterName }}</td>
              <td>{{ formatTime(item.submittedAt) }}</td>
              <td><strong>{{ item.copyright || '待核对' }}</strong><span>{{ item.source || '未填写来源' }}</span></td>
              <td><span class="status-tag" :class="item.status">{{ item.statusLabel }}</span></td>
              <td><button class="review-open-button" @click.stop="openReview(item)">查看审核</button></td>
            </tr>
            <tr v-if="!filteredSubmissions.length"><td colspan="7" class="empty-cell">当前筛选条件下没有投稿</td></tr>
          </tbody></table>
        </div>
      </template>

      <template v-else-if="activeTab === 'animals'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索名字、物种、城市或机构" /></div><div class="toolbar-actions"><span>共 {{ filteredAnimals.length }} 份公开档案</span><button class="primary-button" @click="createAnimal">新增档案</button></div></div>
        <div class="table-panel"><table><thead><tr><th>动物</th><th>物种</th><th>机构 / 城市</th><th>状态</th><th>记录数</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredAnimals" :key="item.id"><td><div class="animal-cell"><img :src="resolveAdminMediaUrl(item.image)" alt="" /><div><strong>{{ item.name }}</strong><span>{{ item.nickname }}</span></div></div></td><td>{{ item.species }}</td><td><strong>{{ item.institution }}</strong><span>{{ item.city }}</span></td><td><span class="status-tag approved">{{ item.statusLabel }}</span></td><td>{{ item.recordCount || item.observations.length }}</td><td><div class="row-actions"><button @click="beginEditAnimal(item)">编辑</button><button class="danger-link" @click="deleteContent('animals', item.id, item.name)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'species'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索中文名、英文名或拉丁名" /></div><div class="toolbar-actions"><span>共 {{ filteredSpecies.length }} 条物种。先建物种，再把个体关联过来。</span><button class="primary-button" @click="createSpecies">新增物种</button></div></div>
        <div class="table-panel"><table><thead><tr><th>中文名</th><th>英文名</th><th>拉丁名</th><th>保护状态</th><th>已关联个体</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredSpecies" :key="item.id"><td><strong>{{ item.biologicalProfile.chineseName }}</strong></td><td>{{ item.biologicalProfile.englishName }}</td><td><i>{{ item.biologicalProfile.latinName }}</i></td><td>{{ item.basicInfo.iucnStatus }}</td><td>{{ linkedAnimalCount(item.id) }}</td><td><div class="row-actions"><button @click="beginEditSpecies(item)">编辑科普</button><button class="danger-link" @click="deleteContent('species', item.id, item.biologicalProfile.chineseName)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'memories'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索标题、作者或内容" /></div><div class="toolbar-actions"><span>共 {{ filteredMemories.length }} 条回忆</span><button class="primary-button" @click="createMemory">新增回忆</button></div></div>
        <div class="table-panel"><table><thead><tr><th>标题</th><th>作者</th><th>日期</th><th>关联动物</th><th>点赞</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredMemories" :key="item.id"><td><strong>{{ item.title }}</strong><span>{{ item.text.slice(0, 60) }}</span></td><td>{{ item.author }}</td><td>{{ item.date }}</td><td>{{ item.animalIds.join(', ') }}</td><td>{{ item.likes }}</td><td><div class="row-actions"><button @click="editingMemory = clone(item)">编辑</button><button class="danger-link" @click="deleteContent('memories', item.id, item.title)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'tasks'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索任务、说明或动物" /></div><div class="toolbar-actions"><span>共 {{ filteredTasks.length }} 个任务</span><button class="primary-button" @click="createTask">新增任务</button></div></div>
        <div class="table-panel"><table><thead><tr><th>任务</th><th>关联动物</th><th>发起者</th><th>贡献数</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredTasks" :key="item.id"><td><strong>{{ item.title }}</strong><span>{{ item.description }}</span></td><td>{{ item.animalName || '不限' }}</td><td>{{ item.creatorName || '--' }}</td><td>{{ item.contributionCount || 0 }}</td><td><div class="row-actions"><button @click="editingTask = clone(item)">编辑</button><button class="danger-link" @click="deleteContent('tasks', item.id, item.title)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'users'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索昵称或用户 ID" /></div><span>共 {{ filteredUsers.length }} 名用户</span></div>
        <div class="table-panel"><table><thead><tr><th>用户</th><th>角色</th><th>状态</th><th>注册时间</th><th>最近登录</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredUsers" :key="item.id"><td><div class="user-cell"><div class="user-avatar"><span>{{ item.nickname.charAt(0) || '用' }}</span><img v-if="item.avatarUrl" :src="resolveAdminMediaUrl(item.avatarUrl)" :alt="`${item.nickname}的头像`" /></div><div><strong>{{ item.nickname }}</strong><span>{{ item.id }}</span></div></div></td><td><select :value="item.role" :disabled="item.id === currentUser.id" @change="updateUser(item, { role: ($event.target as HTMLSelectElement).value as UserRole })"><option value="contributor">贡献者</option><option value="reviewer">审核员</option><option value="admin">管理员</option></select></td><td><span class="status-tag" :class="item.status === 'active' ? 'approved' : 'rejected'">{{ item.status === 'active' ? '正常' : item.status === 'pending' ? '待审核' : '已停用' }}</span></td><td>{{ formatTime(item.createdAt) }}</td><td>{{ item.lastLoginAt ? formatTime(item.lastLoginAt) : '--' }}</td><td><button class="edit-link" :disabled="item.id === currentUser.id" @click="updateUser(item, { status: item.status === 'suspended' ? 'active' : 'suspended' })">{{ item.status === 'suspended' ? '恢复账号' : '停用账号' }}</button></td></tr></tbody></table></div>
      </template>

      <template v-else>
        <div class="table-panel">
          <table>
            <thead><tr><th>时间</th><th>操作员</th><th>操作内容</th><th>对象</th><th>操作</th></tr></thead>
            <tbody>
              <tr
                v-for="item in logs"
                :key="item.id"
                class="log-row"
                tabindex="0"
                :aria-label="`查看日志详情：${item.action}`"
                @click="selectedLog = item"
                @keyup.enter="selectedLog = item"
              >
                <td>{{ formatTime(item.createdAt) }}</td>
                <td>{{ item.operator }}</td>
                <td><strong>{{ item.action }}</strong><span>{{ item.id }}</span></td>
                <td><strong>{{ logTargetTypeLabels[item.targetType] || item.targetType }}</strong><code>{{ item.targetId }}</code></td>
                <td><button class="log-open-button" @click.stop="selectedLog = item">查看详情</button></td>
              </tr>
              <tr v-if="!logs.length"><td colspan="5" class="empty-cell">暂无审核日志</td></tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <div v-if="reviewTarget" class="modal-backdrop" @click="reviewTarget = null">
      <section class="modal-card review-modal" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" @click.stop>
        <header>
          <div>
            <span class="review-modal__eyebrow">{{ typeLabels[reviewTarget.type] }} · {{ reviewTarget.statusLabel }}</span>
            <h2 id="review-dialog-title">{{ reviewTarget.title }}</h2>
            <p>投稿编号：{{ reviewTarget.id }}</p>
          </div>
          <button aria-label="关闭审核详情" @click="reviewTarget = null"><AdminIcon name="close" :size="18" /></button>
        </header>

        <div class="review-meta-grid">
          <div><span>提交者</span><strong>{{ reviewTarget.submitterName }}</strong><small>{{ reviewTarget.userId }}</small></div>
          <div><span>提交时间</span><strong>{{ formatTime(reviewTarget.submittedAt) }}</strong></div>
          <div><span>关联动物</span><strong>{{ reviewTarget.animalName || '待确认动物' }}</strong><small>{{ reviewTarget.animalId || '未绑定档案' }}</small></div>
          <div><span>当前状态</span><strong>{{ reviewTarget.statusLabel }}</strong><small v-if="reviewTarget.reviewedAt">{{ reviewTarget.reviewerName || '审核员' }} · {{ formatTime(reviewTarget.reviewedAt) }}</small></div>
        </div>

        <section class="review-content-section">
          <h3>提交内容</h3>
          <p class="submission-copy">{{ reviewTarget.details }}</p>
        </section>

        <section v-if="reviewTarget.mediaUrl" class="review-content-section">
          <h3>提交图片</h3>
          <a class="review-image-link" :href="resolveAdminMediaUrl(reviewTarget.mediaUrl)" target="_blank" rel="noreferrer">
            <img :src="resolveAdminMediaUrl(reviewTarget.mediaUrl)" alt="投稿图片，点击查看原图" />
            <span>点击图片在浏览器查看原图</span>
          </a>
        </section>

        <section class="review-content-section review-source-grid">
          <div><h3>版权与授权</h3><p>{{ reviewTarget.copyright || '提交者未填写，需人工核对' }}</p></div>
          <div><h3>资料来源</h3><p>{{ reviewTarget.source || '提交者未填写来源' }}</p></div>
        </section>

        <section v-if="reviewPayloadEntries.length" class="review-content-section">
          <h3>表单详细信息</h3>
          <div class="review-payload-grid">
            <div v-for="entry in reviewPayloadEntries" :key="entry.key">
              <span>{{ entry.label }}</span>
              <pre>{{ entry.value }}</pre>
            </div>
          </div>
        </section>

        <section v-if="reviewTarget.status !== 'pending' && reviewTarget.adminComment" class="review-history">
          <h3>上次审核反馈</h3>
          <p>{{ reviewTarget.adminComment }}</p>
        </section>

        <section class="review-decision-section">
          <h3>选择审核结果</h3>
          <div class="review-decision-options" role="radiogroup" aria-label="审核结果">
            <button
              v-for="option in reviewDecisionOptions"
              :key="option.value"
              type="button"
              class="review-decision-card"
              :class="[option.value, { active: reviewDecision === option.value }]"
              :aria-pressed="reviewDecision === option.value"
              @click="selectReviewDecision(option.value)"
            >
              <strong>{{ option.label }}</strong>
              <span>{{ option.description }}</span>
            </button>
          </div>
        </section>

        <label class="review-feedback-field">
          <span>反馈给提交者 <em>*</em></span>
          <textarea v-model="reviewComment" rows="5" maxlength="1000" placeholder="请说明核验结果、公开范围，或需要补充/退回的具体原因"></textarea>
          <small>这段反馈会保存到 MySQL，并在用户端“我的投稿”中展示。</small>
        </label>
        <div v-if="reviewError" class="review-error">{{ reviewError }}</div>

        <footer>
          <button
            v-if="reviewTarget.status === 'approved' && currentUser.role === 'admin'"
            class="secondary-button"
            @click="openApprovedSubmissionEditor(reviewTarget)"
          >编辑已通过内容</button>
          <button class="secondary-button" :disabled="reviewSubmitting" @click="reviewTarget = null">取消</button>
          <button class="primary-button" :class="`decision-${reviewDecision}`" :disabled="reviewSubmitting" @click="submitReview">
            {{ reviewSubmitting ? '正在提交…' : reviewDecision === 'approved' ? '确认通过并公开' : reviewDecision === 'need_supplement' ? '提交补充要求' : '确认退回内容' }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="selectedLog" class="modal-backdrop" @click="selectedLog = null">
      <section class="modal-card review-modal" role="dialog" aria-modal="true" aria-labelledby="log-dialog-title" @click.stop>
        <header>
          <div>
            <span class="review-modal__eyebrow">{{ logTargetTypeLabels[selectedLog.targetType] || selectedLog.targetType }}</span>
            <h2 id="log-dialog-title">{{ selectedLog.action }}</h2>
            <p>日志编号：{{ selectedLog.id }}</p>
          </div>
          <button aria-label="关闭日志详情" @click="selectedLog = null"><AdminIcon name="close" :size="18" /></button>
        </header>

        <div class="review-meta-grid log-meta-grid">
          <div><span>操作时间</span><strong>{{ formatTime(selectedLog.createdAt) }}</strong></div>
          <div><span>操作员</span><strong>{{ selectedLog.operator }}</strong></div>
          <div><span>对象类型</span><strong>{{ logTargetTypeLabels[selectedLog.targetType] || selectedLog.targetType }}</strong></div>
          <div><span>对象 ID</span><strong>{{ selectedLog.targetId }}</strong></div>
        </div>

        <template v-if="selectedLogDetail">
          <section class="review-content-section">
            <h3>对象具体内容</h3>
            <strong class="log-detail-title">{{ selectedLogDetail.title }}</strong>
            <p v-if="selectedLogDetail.description" class="submission-copy">{{ selectedLogDetail.description }}</p>
          </section>

          <section v-if="selectedLogDetail.imageUrl" class="review-content-section">
            <h3>关联图片</h3>
            <a class="review-image-link" :href="resolveAdminMediaUrl(selectedLogDetail.imageUrl)" target="_blank" rel="noreferrer">
              <img :src="resolveAdminMediaUrl(selectedLogDetail.imageUrl)" alt="日志对象图片，点击查看原图" />
              <span>点击图片在浏览器查看原图</span>
            </a>
          </section>

          <section class="review-content-section">
            <h3>详细字段</h3>
            <div class="review-payload-grid">
              <div v-for="field in selectedLogDetail.fields" :key="field.label">
                <span>{{ field.label }}</span>
                <pre>{{ field.value }}</pre>
              </div>
            </div>
          </section>

          <section v-if="selectedLogDetail.payloadEntries?.length" class="review-content-section">
            <h3>原始表单信息</h3>
            <div class="review-payload-grid">
              <div v-for="entry in selectedLogDetail.payloadEntries" :key="entry.key">
                <span>{{ entry.label }}</span>
                <pre>{{ entry.value }}</pre>
              </div>
            </div>
          </section>
        </template>
        <section v-else class="review-content-section log-detail-empty">
          <h3>对象具体内容</h3>
          <p>该对象已经删除，或当前账号无权读取；审核日志仍保留对象 ID 和操作记录。</p>
        </section>

        <footer>
          <button class="secondary-button" @click="selectedLog = null">关闭</button>
          <button v-if="selectedLogSubmission" class="primary-button" @click="openReviewFromLog">打开投稿审核</button>
        </footer>
      </section>
    </div>

    <div v-if="editingApprovedSubmission" class="modal-backdrop modal-backdrop--top" @click="editingApprovedSubmission = null">
      <section class="modal-card modal-card-wide" role="dialog" aria-modal="true" aria-labelledby="approved-edit-title" @click.stop>
        <header>
          <div>
            <h2 id="approved-edit-title">编辑已通过内容</h2>
            <p>保存后会同时更新投稿记录和已发布到用户端的内容，并写入审核日志。</p>
          </div>
          <button aria-label="关闭已通过内容编辑" @click="editingApprovedSubmission = null"><AdminIcon name="close" :size="18" /></button>
        </header>
        <div class="form-grid approved-content-form">
          <label><span>标题</span><input v-model="editingApprovedSubmission.title" maxlength="255" /></label>
          <label><span>关联动物显示名</span><input v-model="editingApprovedSubmission.animalName" /></label>
          <label class="full"><span>内容正文</span><textarea v-model="editingApprovedSubmission.details" rows="6"></textarea></label>
          <label><span>资料来源</span><input v-model="editingApprovedSubmission.source" /></label>
          <label><span>版权与授权</span><input v-model="editingApprovedSubmission.copyright" /></label>
          <label class="full"><span>图片 URL</span><input v-model="editingApprovedSubmission.mediaUrl" /></label>
          <label class="full"><span>表单信息（JSON）</span><textarea v-model="approvedPayloadText" class="json-editor" rows="10" spellcheck="false"></textarea></label>
        </div>
        <div v-if="approvedEditError" class="review-error">{{ approvedEditError }}</div>
        <footer>
          <button class="secondary-button" :disabled="approvedEditSaving" @click="editingApprovedSubmission = null">取消</button>
          <button class="primary-button" :disabled="approvedEditSaving" @click="saveApprovedSubmission">
            {{ approvedEditSaving ? '正在同步…' : '保存并同步公开端' }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="editingAnimal" class="modal-backdrop" @click="editingAnimal = null">
      <section class="modal-card modal-card-wide" @click.stop>
        <header><div><h2>动物档案</h2><p>新增或编辑后直接写入 MySQL</p></div><button aria-label="关闭" @click="editingAnimal = null"><AdminIcon name="close" :size="18" /></button></header>
        <div class="form-grid">
          <label><span>唯一 ID</span><input v-model="editingAnimal.id" /></label><label><span>名字</span><input v-model="editingAnimal.name" /></label><label><span>昵称</span><input v-model="editingAnimal.nickname" /></label><label><span>性别</span><select v-model="editingAnimal.gender"><option>未知</option><option>雄性</option><option>雌性</option></select></label><label><span>机构</span><input v-model="editingAnimal.institution" /></label><label><span>城市</span><input v-model="editingAnimal.city" /></label><label><span>状态说明</span><input v-model="editingAnimal.statusLabel" /></label><label><span>图片 URL</span><input v-model="editingAnimal.image" /></label>
          <label class="full"><span>物种（从已有物种库选择）</span><input v-model="animalSpeciesQuery" placeholder="搜索中文名、英文名或拉丁名" /><select v-model="editingAnimal.speciesCode" @change="applyAdminSpeciesLink"><option :value="UNCERTAIN_SPECIES_CODE">不确定 / 待核实</option><option v-for="item in animalSpeciesOptions" :key="item.id" :value="item.id">{{ item.biologicalProfile.chineseName }} · {{ item.biologicalProfile.englishName }} · {{ item.biologicalProfile.latinName }}</option></select><small>当前：{{ editingAnimal.commonName || "未选择" }} / {{ editingAnimal.species || "—" }} / {{ editingAnimal.scientificName || "—" }}（编号 {{ editingAnimal.speciesCode || "空" }}）。新物种请先在「物种知识」里创建，科普不会写进这只个体。</small></label>
          <div class="image-editor full">
            <img v-if="editingAnimal.image" :src="resolveAdminMediaUrl(editingAnimal.image)" alt="动物图片预览" />
            <div><label class="file-button"><input type="file" accept="image/jpeg,image/png,image/webp" :disabled="imageUploading" @change="uploadAdminImage($event, 'animal')" /><span>{{ imageUploading ? '上传中…' : '上传或更换图片' }}</span></label><a v-if="editingAnimal.image" :href="resolveAdminMediaUrl(editingAnimal.image)" target="_blank" rel="noreferrer">在浏览器查看原图</a><small>图片文件保存到后端 uploads，保存档案后数据库会同步新地址。</small></div>
          </div>
          <label class="full"><span>档案摘要</span><textarea v-model="editingAnimal.summary" rows="4"></textarea></label>
        </div>
        <footer><button class="secondary-button" @click="editingAnimal = null">取消</button><button class="primary-button" @click="saveAnimal">保存并同步</button></footer>
      </section>
    </div>

    <div v-if="editingSpecies" class="modal-backdrop" @click="editingSpecies = null">
      <section class="modal-card modal-card-wide" @click.stop>
        <header><div><h2>{{ speciesEditorIsNew ? "新建物种" : "编辑物种科普" }}</h2><p>可以在还没有任何个体时建立。保存后立即出现在物种库和个体的物种选择里。</p></div><button aria-label="关闭" @click="editingSpecies = null"><AdminIcon name="close" :size="18" /></button></header>
        <SpeciesEditor ref="speciesEditorRef" :species="editingSpecies" :is-new="speciesEditorIsNew" />
        <footer><button class="secondary-button" @click="editingSpecies = null">取消</button><button class="primary-button" @click="saveSpecies">保存物种科普</button></footer>
      </section>
    </div>

    <div v-if="editingMemory" class="modal-backdrop" @click="editingMemory = null">
      <section class="modal-card modal-card-wide" @click.stop>
        <header><div><h2>公众回忆</h2><p>保存后公众端立即从 API 读取</p></div><button aria-label="关闭" @click="editingMemory = null"><AdminIcon name="close" :size="18" /></button></header>
        <div class="form-grid">
          <label><span>唯一 ID</span><input v-model="editingMemory.id" /></label><label><span>标题</span><input v-model="editingMemory.title" /></label><label><span>作者</span><input v-model="editingMemory.author" /></label><label><span>日期</span><input v-model="editingMemory.date" /></label><label><span>关联动物 ID（逗号分隔）</span><input :value="editingMemory.animalIds.join(',')" @input="editingMemory.animalIds = ($event.target as HTMLInputElement).value.split(',').map((item) => item.trim())" /></label><label><span>图片 URL</span><input v-model="editingMemory.image" /></label>
          <div class="image-editor full">
            <img v-if="editingMemory.image" :src="resolveAdminMediaUrl(editingMemory.image)" alt="回忆图片预览" />
            <div><label class="file-button"><input type="file" accept="image/jpeg,image/png,image/webp" :disabled="imageUploading" @change="uploadAdminImage($event, 'memory')" /><span>{{ imageUploading ? '上传中…' : '上传或更换图片' }}</span></label><a v-if="editingMemory.image" :href="resolveAdminMediaUrl(editingMemory.image)" target="_blank" rel="noreferrer">在浏览器查看原图</a><small>图片文件保存到后端 uploads，保存内容后数据库会同步新地址。</small></div>
          </div>
          <label class="full"><span>内容</span><textarea v-model="editingMemory.text" rows="6"></textarea></label>
        </div>
        <footer><button class="secondary-button" @click="editingMemory = null">取消</button><button class="primary-button" @click="saveMemory">保存并同步</button></footer>
      </section>
    </div>

    <div v-if="editingTask" class="modal-backdrop" @click="editingTask = null"><section class="modal-card modal-card-wide" @click.stop><header><div><h2>协作任务</h2><p>保存后公众端任务中心立即可见</p></div><button aria-label="关闭" @click="editingTask = null"><AdminIcon name="close" :size="18" /></button></header><div class="form-grid"><label><span>唯一 ID</span><input v-model="editingTask.id" /></label><label><span>任务标题</span><input v-model="editingTask.title" /></label><label><span>关联动物 ID</span><input v-model="editingTask.animalId" /></label><label><span>关联动物名称</span><input v-model="editingTask.animalName" /></label><label><span>发起者</span><input v-model="editingTask.creatorName" /></label><label><span>任务回报说明</span><input v-model="editingTask.rewardLabel" /></label><label class="full"><span>任务说明</span><textarea v-model="editingTask.description" rows="4"></textarea></label><label class="full"><span>期望资料</span><textarea v-model="editingTask.expectedInfo" rows="3"></textarea></label></div><footer><button class="secondary-button" @click="editingTask = null">取消</button><button class="primary-button" @click="saveTask">保存并同步</button></footer></section></div>

    <div v-if="toast" class="toast">{{ toast }}</div>
    <div v-if="loading" class="loading-mask"><span>正在同步数据…</span></div>
  </div>
</template>
