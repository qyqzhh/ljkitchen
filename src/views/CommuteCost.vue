<template>
  <div class="commute-cost-page">
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
      </button>
      <div class="nav-title">通勤费用计算</div>
      <div class="nav-placeholder"></div>
    </div>

    <div class="content">
      <div class="form-section">
        <div class="form-item">
          <label class="form-label">地铁折前单程金额（元）</label>
          <input
            type="number"
            v-model="formData.metroFare"
            class="form-input"
            placeholder="默认 0 元"
            min="0"
            step="0.5"
            inputmode="decimal"
          />
        </div>

        <div class="form-item">
          <label class="form-label">公交单程金额（元）</label>
          <input
            type="number"
            v-model="formData.busFare"
            class="form-input"
            placeholder="默认 0 元"
            min="0"
            step="0.5"
            inputmode="decimal"
          />
        </div>

        <div class="form-item">
          <label class="form-label">每日通勤次数</label>
          <input
            type="number"
            v-model="formData.tripsPerDay"
            class="form-input"
            placeholder="默认 2 次（上班 + 下班）"
            min="1"
            max="10"
            step="1"
            inputmode="numeric"
          />
        </div>

        <div class="form-item">
          <label class="form-label">每月通勤天数 <span class="required">*</span></label>
          <input
            type="number"
            v-model="formData.workDays"
            class="form-input"
            placeholder="请输入 1 - 31 的整数"
            min="1"
            max="31"
            step="1"
            inputmode="numeric"
          />
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <div class="form-actions">
        <button class="calc-btn" @click="handleCalc">计算</button>
      </div>

      <div v-if="result" class="result-section">
        <div class="result-title">计算结果</div>
        <div class="result-row">
          <span class="result-label">每月通勤天数</span>
          <span class="result-value">{{ result.workDays }} 天</span>
        </div>
        <div class="result-row">
          <span class="result-label">地铁月费用</span>
          <span class="result-value">
            ¥{{ formatMoney(result.metroCost) }}
            <span v-if="result.metroSavings > 0" class="result-sub">（原价 ¥{{ formatMoney(result.metroFull) }}，优惠 ¥{{ formatMoney(result.metroSavings) }}）</span>
          </span>
        </div>
        <div class="result-row">
          <span class="result-label">公交月费用</span>
          <span class="result-value">¥{{ formatMoney(result.busCost) }}</span>
        </div>
        <div class="result-row result-total">
          <span class="result-label">月通勤总费用</span>
          <span class="result-value total">¥{{ formatMoney(result.total) }}</span>
        </div>
        <div class="result-rule">
          地铁折扣规则：按自然月累计实付金额，满 100 元后乘 8 折，满 150 元后乘 5 折，满 400 元后恢复原价（从下一次乘车生效）。每次通勤按地铁、公交各 1 趟计算。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formData = reactive({
  metroFare: 0,
  busFare: 0,
  tripsPerDay: 2,
  workDays: null
})

const errorMsg = ref('')
const result = ref(null)

function formatMoney(n) {
  const fixed = Number(n).toFixed(2)
  return fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed.replace(/0$/, '')
}

// 地铁月费用：按月内累计实付逐次模拟折扣
function calcMetroCost(fullFare, rides) {
  let paid = 0
  let cost = 0
  for (let i = 0; i < rides; i++) {
    let fare = fullFare
    if (paid >= 400) {
      fare = fullFare
    } else if (paid >= 150) {
      fare = fullFare * 0.5
    } else if (paid >= 100) {
      fare = fullFare * 0.8
    }
    cost += fare
    paid += fare
  }
  return cost
}

function validate() {
  const metro = formData.metroFare
  const bus = formData.busFare
  const trips = formData.tripsPerDay
  const days = formData.workDays

  if (metro === null || metro === '' || isNaN(metro) || metro < 0) {
    return '地铁单程金额不能为空且不能小于 0'
  }
  if (metro > 1000) {
    return '地铁单程金额不能超过 1000 元'
  }
  if (bus === null || bus === '' || isNaN(bus) || bus < 0) {
    return '公交单程金额不能为空且不能小于 0'
  }
  if (bus > 1000) {
    return '公交单程金额不能超过 1000 元'
  }
  if (!Number.isInteger(Number(trips)) || trips < 1 || trips > 10) {
    return '每日通勤次数须为 1 - 10 的整数'
  }
  if (days === null || days === '' || isNaN(days)) {
    return '请输入每月通勤天数'
  }
  if (!Number.isInteger(Number(days)) || days < 1 || days > 31) {
    return '每月通勤天数须为 1 - 31 的整数'
  }
  if (metro === 0 && bus === 0) {
    return '地铁和公交金额不能同时为 0，请至少填写一项'
  }
  return ''
}

function handleCalc() {
  errorMsg.value = validate()
  if (errorMsg.value) {
    result.value = null
    return
  }

  const metroFare = Number(formData.metroFare)
  const busFare = Number(formData.busFare)
  const trips = Number(formData.tripsPerDay)
  const days = Number(formData.workDays)

  const rides = days * trips
  const metroCost = metroFare > 0 ? calcMetroCost(metroFare, rides) : 0
  const metroFull = metroFare * rides
  const busCost = busFare * rides

  result.value = {
    workDays: days,
    metroCost,
    metroFull,
    metroSavings: metroFull - metroCost,
    busCost,
    total: metroCost + busCost
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.commute-cost-page {
  width: 100%;
  height: 100%;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-color);
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}

.nav-placeholder {
  width: 36px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 40px;
}

.form-section {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.form-item {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 10px;
}

.required {
  color: var(--danger-color);
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--primary-color);
}

.error-msg {
  margin-top: 12px;
  padding: 10px 14px;
  background-color: #fff1f0;
  color: var(--danger-color);
  font-size: 13px;
  border-radius: 8px;
}

.form-actions {
  padding: 20px 0;
}

.calc-btn {
  width: 100%;
  height: 48px;
  background-color: var(--primary-color);
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calc-btn:hover {
  background-color: var(--primary-dark);
}

.result-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.result-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 0;
}

.result-label {
  font-size: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.result-value {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
  text-align: right;
}

.result-sub {
  font-size: 12px;
  color: var(--success-color);
  font-weight: 400;
}

.result-total {
  border-top: 1px solid var(--border-color);
  margin-top: 6px;
  padding-top: 14px;
}

.result-value.total {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-color);
}

.result-rule {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-color);
  font-size: 12px;
  color: var(--text-light);
  line-height: 1.6;
}
</style>
