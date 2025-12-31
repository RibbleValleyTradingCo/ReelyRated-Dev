# Chart Style Guidelines & Accessibility Standards

This document defines the style, contrast, and accessibility guidelines for all chart and data visualization components in the ReelyRatedv3 web app.  
Follow these guidelines to ensure charts are usable, accessible, and readable in both light and dark modes, and compliant with WCAG standards.

---

## 🎯 Purpose

Charts communicate data visually but must remain legible and understandable to all users, including those with visual impairments. The guidelines here combine **WCAG 2.1 accessibility criteria**, color contrast best practices, and chart design principles.

---

## 🧭 WCAG Accessibility Reference

Refer to the Web Content Accessibility Guidelines (WCAG) for accessible data visuals:

### Contrast Requirements

- **Text and images of text must meet WCAG 1.4.3 Minimum Contrast:**
  - **Normal text ≥ 4.5:1** against background
  - **Large text (≥ 18pt or 14pt bold) ≥ 3:1** against background
  - **UI components & meaningful graphical objects ≥ 3:1** against adjacent color(s) ([dubbot.com](https://dubbot.com/dubblog/2023/dark-mode-a11y.html?utm_source=chatgpt.com))

### Non‑Text Contrast

- **UI components and graphical objects** such as chart axes, ticks, legends, and bars must also meet **3:1 contrast** when necessary for comprehension. ([w3.org](https://www.w3.org/WAI/WCAG22/understanding/non-text-contrast.html?utm_source=chatgpt.com))

#### Color‑Only Information

- Do **not use color alone** to distinguish data patterns; provide supporting labels, shapes, or patterns. ([216digital.com](https://216digital.com/creating-accessible-data-for-charts-and-graphs/?utm_source=chatgpt.com))

---

## 📊 General Chart Style Principles

### Backgrounds & Surface Contrast

- Chart canvases should contrast with page background; clearly differentiate chart area from page surfaces.
- For dark mode, avoid pure black backgrounds; use dark gray tones for better depth perception. ([dubbot.com](https://dubbot.com/dubblog/2023/dark-mode-a11y.html?utm_source=chatgpt.com))

### Text Labels & Axis Styling

- Axis labels, tick values, data labels, and legends should use high contrast tokens such as `text-foreground` or `text-muted-foreground`.
- Use sans‑serif fonts for legibility.
- Ensure text meets **WCAG minimum contrast ratios** for all modes. ([numberanalytics.com](https://www.numberanalytics.com/blog/universal-accessibility-charts?utm_source=chatgpt.com))

Example:

```tsx
axisLabel={{
  fill: tokenColor('text-foreground'),
  fontSize: 12
}}
```

### Gridlines

- Gridlines support readability but should not overpower data.
- Use subtle, low‑contrast lines (e.g., tokenized muted colors with opacity ≥ 0.3). ([analysisfunction.civilservice.gov.uk](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts/?utm_source=chatgpt.com))

---

## 🎨 Color & Data Series

### Distinguishing Data Elements

- If using color to separate data series, ensure each series meets contrast requirements with background and neighboring series.
- Provide alternate cues such as line styles, patterns, or direct labeling when possible. ([216digital.com](https://216digital.com/creating-accessible-data-for-charts-and-graphs/?utm_source=chatgpt.com))

### Color Blind‑Friendly Palettes

- Choose palettes that perform well under color blindness simulations (e.g., avoid red/green combinations).
- Test chart colors in grayscale to ensure distinguishable information. ([ymfphilly.org](https://www.ymfphilly.org/images/JEDI/JEDI%20Resources_Guidelines%20for%20Creating%20Visually%20Accessible%20Content.pdf?utm_source=chatgpt.com))

---

## 🧩 Shape & Pattern Support

To ensure that information is not conveyed by color alone:

- Use dashed or dotted lines for additional data distinction.
- Use shapes or marker variations in line charts.
- Apply patterns or textures for bar and pie charts. ([216digital.com](https://216digital.com/creating-accessible-data-for-charts-and-graphs/?utm_source=chatgpt.com))

---

## 🛠 Interactive & Dynamic Elements

### Tooltips

Tooltips must contrast with chart background and follow the same contrast guidelines as UI surfaces:

```tsx
tooltip={{
  background: tokenColor('bg-card'),
  border: tokenColor('border-border'),
  text: tokenColor('text-foreground'),
}}
```

### Highlights & Focus

- When interacting with a data point (hover, focus), ensure highlight state does not reduce accessibility.
- Maintain contrast and clarity on dark mode interaction states.

---

## 🧪 Testing & Validation

- Test each chart visually in both light and dark themes across responsive layouts.
- Use accessibility tools (e.g., WebAIM Contrast Checker, browser DevTools) to verify contrast ratios.
- Verify that chart information is interpretable without color alone.

---

## 📝 Summary Checklist

Use this checklist when reviewing or implementing charts:

- [ ] Chart background contrasts with the surrounding page.
- [ ] All text labels meet WCAG minimum contrast.
- [ ] Gridlines are subtle but perceptible.
- [ ] Multiple series are distinguished without color only.
- [ ] Tooltips and interactions maintain contrast.
- [ ] Chart elements scale properly on zoom and responsive breakpoints.
- [ ] Charts are tested under grayscale and color blindness simulations.

---

## 📌 References

- WCAG 2.1 Color contrast and non‑text contrast standards. ([dubbot.com](https://dubbot.com/dubblog/2023/dark-mode-a11y.html?utm_source=chatgpt.com))
- Use of alternate visuals for color‑only cues. ([216digital.com](https://216digital.com/creating-accessible-data-for-charts-and-graphs/?utm_source=chatgpt.com))
- Chart labeling and distinction suggestions. ([analysisfunction.civilservice.gov.uk](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-colours-in-charts/?utm_source=chatgpt.com))

```

```
