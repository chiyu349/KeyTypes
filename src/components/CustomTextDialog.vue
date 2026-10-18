<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { checkCustomText } from '@/domain/customText'
import { useCustomTextsStore } from '@/stores/customTexts'
import { useSettingsStore } from '@/stores/settings'
import { methodName } from '@/types'
import type { CustomText } from '@/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const settings = useSettingsStore()
const customStore = useCustomTextsStore()

const name = ref('')
const text = ref('')

const activeMethod = computed(() => settings.state.method)
const check = computed(() => checkCustomText(text.value, activeMethod.value))
const list = computed(() => customStore.items)

watch(
  () => props.open,
  (open) => {
    if (open) {
      name.value = ''
      text.value = ''
    }
  },
)

function close(): void {
  emit('close')
}

function save(): void {
  if (!check.value.ok) return
  const item = customStore.add(name.value, text.value, activeMethod.value)
  settings.useCustomText(item.id, activeMethod.value)
  close()
}

function use(item: CustomText): void {
  settings.useCustomText(item.id, item.method)
  close()
}

function remove(item: CustomText): void {
  if (!window.confirm(`删除「${item.name}」？`)) return
  customStore.remove(item.id)
  if (settings.state.activeCustomId === item.id) settings.useBuiltin()
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal custom-modal" role="dialog" aria-modal="true" aria-label="自定义练习文本">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Custom text</p>
            <h2>自定义练习文本</h2>
            <p class="muted small">粘贴或输入中文，保存后即可反复练习。当前输入法：{{ methodName(activeMethod) }}</p>
          </div>
          <button type="button" class="modal-close" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <label class="field">
              <span>名称</span>
              <input v-model="name" class="input" type="text" maxlength="24" placeholder="例如：我的常用短句" />
            </label>
            <label class="field">
              <span>文本（汉字、空格与标点，最多 800 字）</span>
              <textarea
                v-model="text"
                class="textarea"
                maxlength="800"
                placeholder="例如：每天练习二十分钟效果会比周末突击更好"
              />
            </label>
          </div>

          <div class="checkline">
            <span class="faint small">已识别 {{ check.chars }} 个汉字</span>
            <span v-if="check.ok" class="tag">可以保存</span>
            <span v-else class="faint small">还需补充内容</span>
          </div>

          <ul v-if="check.issues.length" class="issue-list">
            <li v-for="issue in check.issues" :key="issue">{{ issue }}</li>
          </ul>

          <div class="saved-head">
            <span class="card-title">已保存</span>
            <span class="faint small">最多 20 条</span>
          </div>
          <ul v-if="list.length" class="custom-list">
            <li v-for="item in list" :key="item.id">
              <div class="custom-copy">
                <strong>{{ item.name }}</strong>
                <small>{{ methodName(item.method) }} · {{ item.text.length }} 字符</small>
              </div>
              <div class="custom-actions">
                <button type="button" class="btn sm" @click="use(item)">使用</button>
                <button type="button" class="btn sm danger" @click="remove(item)">删除</button>
              </div>
            </li>
          </ul>
          <p v-else class="faint small empty-saved">还没有保存的自定义文本。</p>
        </div>

        <div class="modal-foot">
          <button type="button" class="btn ghost" @click="close">取消</button>
          <button type="button" class="btn primary" :disabled="!check.ok" @click="save">
            保存并开始
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-modal {
  width: min(700px, 94vw);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.issue-list {
  margin: 8px 0 0;
  padding: 10px 12px 10px 28px;
  border-radius: var(--radius-sm);
  background: var(--err-soft);
  color: var(--err);
  font-size: 12px;
  line-height: 1.6;
}

.saved-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 20px 0 8px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.custom-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow: auto;
}

.custom-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-soft);
}

.custom-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.4;
}

.custom-copy strong {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-copy small {
  font-size: 11px;
  color: var(--text-faint);
}

.custom-actions {
  display: flex;
  gap: 6px;
  flex: none;
}

.empty-saved {
  padding: 10px 0;
}
</style>
