import test from "node:test";
import assert from "node:assert/strict";
import { reportRange, verifyDailyLeadWork } from "./agentDailyReport.js";

test("reportRange day uses Dubai calendar day bounds", () => {
  const out = reportRange({ mode: "day", day: "2026-09-15" }, new Date("2026-10-01T10:00:00Z"));
  assert.equal(out.from, "2026-09-15 00:00:00");
  assert.equal(out.to, "2026-09-15 23:59:59");
  assert.equal(out.label, "2026-09-15");
});

test("reportRange month covers full month", () => {
  const out = reportRange({ mode: "month", month: "2026-09" });
  assert.equal(out.from, "2026-09-01 00:00:00");
  assert.equal(out.to, "2026-09-30 23:59:59");
  assert.equal(out.label, "2026-09");
});

test("verifyDailyLeadWork ignores modify-only old leads and other agents' activity", () => {
  const statuses = [{ STATUS_ID: "NEW", NAME: "New" }, { STATUS_ID: "IN_PROCESS", NAME: "Contacted/In Progress" }];
  const out = verifyDailyLeadWork({
    agentId: "2258",
    from: "2026-10-02 00:00:00",
    to: "2026-10-02 23:59:59",
    leadStatuses: statuses,
    myActivityLeadIds: ["78740"], // activity on Asma's lead — must NOT count
    history: {
      createdRows: [],
      worked: [
        {
          id: "65217",
          title: "Old PF call",
          assignedById: "2258",
          status: "Broker/Agent",
          created: "2026-03-13 10:53:53",
          modified: "2026-10-02 07:22:45",
          worked: true,
        },
      ],
      idle: [],
    },
  });
  assert.equal(out.worked.length, 0);
  assert.equal(out.idle.length, 0);
  assert.equal(out.ignoredModifyOnly, 1);
});

test("verifyDailyLeadWork counts created-in-period non-idle and own-lead activity", () => {
  const statuses = [
    { STATUS_ID: "NEW", NAME: "New" },
    { STATUS_ID: "IN_PROCESS", NAME: "Contacted/In Progress" },
  ];
  const out = verifyDailyLeadWork({
    agentId: "2258",
    from: "2026-10-02 00:00:00",
    to: "2026-10-02 23:59:59",
    leadStatuses: statuses,
    myActivityLeadIds: ["90001"],
    history: {
      createdRows: [
        {
          ID: "90002",
          TITLE: "New lead",
          ASSIGNED_BY_ID: "2258",
          STATUS_ID: "IN_PROCESS",
          DATE_CREATE: "2026-10-02 09:00:00",
          DATE_MODIFY: "2026-10-02 10:00:00",
        },
        {
          ID: "90003",
          TITLE: "Idle lead",
          ASSIGNED_BY_ID: "2258",
          STATUS_ID: "NEW",
          DATE_CREATE: "2026-10-02 11:00:00",
          DATE_MODIFY: "2026-10-02 11:00:00",
        },
      ],
      worked: [
        {
          id: "90001",
          title: "Older own lead",
          assignedById: "2258",
          status: "Contacted/In Progress",
          created: "2026-09-01 10:00:00",
          modified: "2026-10-02 12:00:00",
          worked: true,
        },
      ],
      idle: [],
    },
  });
  const ids = out.worked.map((row) => row.id).sort();
  assert.deepEqual(ids, ["90001", "90002"]);
  assert.equal(out.idle.length, 1);
  assert.equal(out.idle[0].id, "90003");
});
