---
name: no-device-connect
description: Never ask mondo to connect his device, folder or Remote Control; work only in the cloud checkout
metadata:
  type: feedback
  modified: 2026-10-06T21:27:58.291Z
---
2026-10-06: mondo got a "Connect your device to this thread?" card and was furious: "never ask me this bullshit again. i do not want to connect my device. I am on a browser."
**Why:** he plays and works in a browser; device prompts are noise to him.
**How to apply:** never call connect_device, start_rc_session or device folder requests. Work in the cloud checkout, R2 reads and /mnt/project-files only.
