import { LeadExtractSchema } from "./schemas";

describe("LeadExtractSchema", () => {
  describe("validation", () => {
    it("should validate a complete lead extract", () => {
      const validData = {
        customer_name: "John Doe",
        customer_number: "555-1234",
        customer_address: "123 Main St",
        service_requested: "Plumbing",
        provider_lead_id: "lead-123",
        provider: "Google LSA",
        lead_metadata: { key: "value" },
      };

      const result = LeadExtractSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer_name).toBe("John Doe");
        expect(result.data.customer_number).toBe("555-1234");
        expect(result.data.customer_address).toBe("123 Main St");
        expect(result.data.service_requested).toBe("Plumbing");
        expect(result.data.provider).toBe("Google LSA");
      }
    });

    it("should validate with all null values", () => {
      const dataWithNulls = {
        customer_name: null,
        customer_number: null,
        customer_address: null,
        service_requested: null,
        provider_lead_id: null,
        provider: null,
        lead_metadata: null,
      };

      const result = LeadExtractSchema.safeParse(dataWithNulls);
      expect(result.success).toBe(true);
    });

    it("should validate with all undefined values", () => {
      const dataWithUndefined = {
        customer_name: undefined,
        customer_number: undefined,
        customer_address: undefined,
        service_requested: undefined,
        provider_lead_id: undefined,
        provider: undefined,
        lead_metadata: undefined,
      };

      const result = LeadExtractSchema.safeParse(dataWithUndefined);
      expect(result.success).toBe(true);
    });

    it("should validate with empty object", () => {
      const result = LeadExtractSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate with partial data", () => {
      const partialData = {
        customer_name: "Jane Doe",
        customer_number: "555-5678",
      };

      const result = LeadExtractSchema.safeParse(partialData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer_name).toBe("Jane Doe");
        expect(result.data.customer_number).toBe("555-5678");
        expect(result.data.customer_address).toBeUndefined();
      }
    });

    it("should validate with lead_metadata", () => {
      const dataWithMetadata = {
        customer_name: "Test User",
        lead_metadata: {
          source: "email",
          priority: "high",
          tags: ["urgent", "follow-up"],
        },
      };

      const result = LeadExtractSchema.safeParse(dataWithMetadata);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lead_metadata).toEqual({
          source: "email",
          priority: "high",
          tags: ["urgent", "follow-up"],
        });
      }
    });

    it("should accept string values for all fields", () => {
      const stringData = {
        customer_name: "John",
        customer_number: "123",
        customer_address: "Address",
        service_requested: "Service",
        provider_lead_id: "ID",
        provider: "Provider",
      };

      const result = LeadExtractSchema.safeParse(stringData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid types", () => {
      const invalidData = {
        customer_name: 123, // Should be string
        customer_number: true, // Should be string
      };

      const result = LeadExtractSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
