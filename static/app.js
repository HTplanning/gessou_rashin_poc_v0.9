/* 月相羅針 計算PoC v0.9｜画面デザイン調整版
 *
 * Vue.js is responsible only for input state, API communication, errors,
 * loading state, and rendering. Astronomical calculation and phase
 * classification remain in Flask / Python.
 */

(() => {
  "use strict";

  if (typeof Vue === "undefined") {
    console.error("Vue 3 could not be loaded.");
    return;
  }

  const { createApp } = Vue;

  createApp({
    data() {
      return {
        form: {
          birth_date: "",
          birth_time: "",
          birth_place: "",
        },
        errors: [],
        loading: false,
        result: null,
      };
    },

    methods: {
      pad2(value) {
        return String(value).padStart(2, "0");
      },

      currentLocalDate() {
        const now = new Date();
        return [
          now.getFullYear(),
          this.pad2(now.getMonth() + 1),
          this.pad2(now.getDate()),
        ].join("-");
      },

      currentLocalTime() {
        const now = new Date();
        return `${this.pad2(now.getHours())}:${this.pad2(now.getMinutes())}`;
      },

      primeCurrentValue(fieldName, event) {
        // v0.6仕様を維持：空欄でネイティブdate/time入力を開く直前に、
        // 端末ローカルの現在年月日／現在時刻を現在値として用意する。
        // 既存値がある場合は上書きしない。
        if (this.form[fieldName]) return;

        let value = "";
        if (fieldName === "birth_date") {
          value = this.currentLocalDate();
        } else if (fieldName === "birth_time") {
          value = this.currentLocalTime();
        }

        if (!value) return;

        this.form[fieldName] = value;

        // iPad/Safariではpointerdown直後にネイティブ入力画面が開くため、
        // Vueの次回DOM更新を待たず対象inputにも同期しておく。
        if (event && event.currentTarget && !event.currentTarget.value) {
          event.currentTarget.value = value;
        }
      },

      resetForm() {
        // v0.5以降の仕様を維持：前回計算値へ戻さず、3項目とも空欄にする。
        this.form.birth_date = "";
        this.form.birth_time = "";
        this.form.birth_place = "";
        this.errors = [];
        this.result = null;
      },

      async calculate() {
        if (this.loading) return;

        this.loading = true;
        this.errors = [];
        this.result = null;

        try {
          const response = await fetch("/api/calculate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              birth_date: this.form.birth_date,
              birth_time: this.form.birth_time,
              birth_place: this.form.birth_place,
            }),
          });

          let payload;
          try {
            payload = await response.json();
          } catch (_error) {
            payload = null;
          }

          if (!payload || payload.success !== true) {
            this.errors = payload && Array.isArray(payload.errors)
              ? payload.errors
              : ["計算中にエラーが発生しました。もう一度お試しください。"];
            return;
          }

          this.result = payload.result;
        } catch (_error) {
          this.errors = ["サーバーとの通信に失敗しました。もう一度お試しください。"];
        } finally {
          this.loading = false;
        }
      },

      formatNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number.toFixed(8) : "";
      },

      candidateLabel(index) {
        if (!this.result || !Array.isArray(this.result.possible_phases)) {
          return "候補";
        }
        return this.result.possible_phases.length > 1 ? `候補${index + 1}` : "候補";
      },

      coordinatesText(result) {
        if (!result) return "";
        const latitude = result.latitude;
        const longitude = result.longitude;
        if (typeof latitude === "number" && typeof longitude === "number") {
          return `${latitude}, ${longitude}`;
        }
        return "PoCでは未設定";
      },

      statusLabel(status) {
        if (status === "stable") return "stable（一日を通して同一分類）";
        if (status === "ambiguous") return "ambiguous（複数候補あり）";
        if (status === "exact") return "exact（出生時間あり）";
        return status || "";
      },
    },
  }).mount("#app");
})();
