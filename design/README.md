# Audited mini-program homepage (front-end plan pages 5–6)

`styles/design-tokens.wxss` is the exact generated WXSS artifact from
GdeiAssistant/GdeiAssistant `design/tokens.json` (shared-token PR #288), copied
without local edits. The homepage consumes the color, typography, radius and
spacing variables. Existing styles outside the homepage keep their aliases.

`image/linear/{light,dark}` contains the same Lucide SVG paths used by the Web
homepage's `iconMap`, exported from its installed `lucide-vue-next` 1.0.0 with
stroke width 1.8. Home-only settings, logout, notification and news icons use
that same library. The ISC license is in `image/LUCIDE-LICENSE`. Explicit themed
assets avoid relying on `currentColor` inheritance across an image boundary;
the existing theme class also switches the assets after a system theme change.
No runtime icon dependency was added. See [Lucide Vue documentation](https://v0.lucide.dev/guide/packages/lucide-vue-next).

Today's courses reuse the existing authenticated `getSchedule()` route. Campus
date is UTC+8; courses are filtered by `column` and the returned current `week`
against `minScheduleWeek`/`maxScheduleWeek`. Course names, lesson labels and
locations come from the response. The contract has no start/end clock times,
so this card cannot establish a next class or remaining classes. It explicitly
links to the existing timetable and never substitutes the design's 14:30 sample.
Unknown/failing data is unavailable, not an empty successful day. Demo mode
retains the existing data-source label. Feature visibility and routes remain
under the existing feature configuration.
The card is displayed and its timetable is requested only when the existing
filtered home sections contain the schedule entry; hiding that feature also
blocks late responses from updating the card.

Validation uses the repository's locale check, Node tests, lint and smoke.
The [WeChat image documentation](https://developers.weixin.qq.com/miniprogram/dev/component/image.html)
could not be retrieved in this environment. WeChat DevTools is unavailable:
native WXML rendering, SVG display, responsive layout and device theme switching
still require a DevTools/device check before visual acceptance. HTML previews
are not proof of mini-program rendering.
