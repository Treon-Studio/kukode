export type TAnalyticsEventProps = {
  readonly siteId?: string;
  readonly eventType: "view" | "click";
  readonly referrer?: string;
  readonly ip?: string;
  readonly userId?: string;
  readonly country?: string;
  readonly city?: string;
};

export type TAnalyticsEvent = TAnalyticsEventProps & {
  readonly createdAt: Date;
};

export type TPlatformStats = {
  readonly dau: number;
  readonly mau: number;
};
