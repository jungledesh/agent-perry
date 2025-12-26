import {
  extractMetadata,
  persistExtractedData,
  triggerCommunication,
  updateStatus,
} from "./activities";
import { PrismaClient } from "@prisma/client";

// Mock dependencies
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("langchain/hub", () => ({
  pull: jest.fn(),
}));

jest.mock("@langchain/core/prompts", () => ({
  ChatPromptTemplate: jest.fn(),
}));

jest.mock("@langchain/openai", () => ({
  ChatOpenAI: jest.fn(),
}));

jest.mock("@nestjs/common", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    leads: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// Mock global fetch
global.fetch = jest.fn();

describe("Activities", () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  const mockLead = {
    id: 1,
    customer_name: "John Doe",
    customer_number: "555-1234",
    customer_address: "123 Main St",
    service_requested: "Plumbing",
    status: "new",
    provider: "Google LSA",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    process.env.LANGSMITH_API_KEY = "test-key";
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LANGSMITH_PROMPT_NAME = "test-prompt";
    process.env.BACKEND_URL = "http://localhost:3000";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("extractMetadata", () => {
    it("should throw error if API keys are missing", async () => {
      delete process.env.LANGSMITH_API_KEY;

      await expect(
        extractMetadata("test body", "test subject"),
      ).rejects.toThrow("Missing API keys");
    });

    it("should throw error if prompt name is missing", async () => {
      delete process.env.LANGSMITH_PROMPT_NAME;

      await expect(
        extractMetadata("test body", "test subject"),
      ).rejects.toThrow("Missing environment variable: LANGSMITH_PROMPT_NAME");
    });

    it("should throw error if prompt fetch fails", async () => {
      const langchainHub = require("langchain/hub");
      (langchainHub.pull as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch"),
      );

      await expect(
        extractMetadata("test body", "test subject"),
      ).rejects.toThrow("Failed to fetch prompt");
    });
  });

  describe("persistExtractedData", () => {
    const extractedData = {
      customer_name: "John Doe",
      customer_number: "555-1234",
      customer_address: "123 Main St",
      service_requested: "Plumbing",
      provider: "Google LSA",
    };

    it("should persist extracted data successfully", async () => {
      (mockPrisma.leads.findUnique as jest.Mock).mockResolvedValue({
        provider: "Unknown",
      });
      (mockPrisma.leads.update as jest.Mock).mockResolvedValue(mockLead);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await persistExtractedData(1, extractedData);

      expect(mockPrisma.leads.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { provider: true },
      });
      expect(mockPrisma.leads.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          customer_name: "John Doe",
          customer_number: "555-1234",
          customer_address: "123 Main St",
          service_requested: "Plumbing",
          provider: "Google LSA",
        }),
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/leads/notify-update",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: 1 }),
        }),
      );
    });

    it("should use extracted provider when current is Unknown", async () => {
      (mockPrisma.leads.findUnique as jest.Mock).mockResolvedValue({
        provider: "Unknown",
      });
      (mockPrisma.leads.update as jest.Mock).mockResolvedValue(mockLead);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await persistExtractedData(1, {
        ...extractedData,
        provider: "Yelp",
      });

      expect(mockPrisma.leads.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          provider: "Yelp",
        }),
      });
    });

    it("should not override existing provider if not Unknown", async () => {
      (mockPrisma.leads.findUnique as jest.Mock).mockResolvedValue({
        provider: "Google LSA",
      });
      (mockPrisma.leads.update as jest.Mock).mockResolvedValue(mockLead);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await persistExtractedData(1, {
        ...extractedData,
        provider: "Yelp",
      });

      expect(mockPrisma.leads.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.not.objectContaining({
          provider: expect.anything(),
        }),
      });
    });

    it("should handle null values in extracted data", async () => {
      (mockPrisma.leads.findUnique as jest.Mock).mockResolvedValue({
        provider: "Google LSA",
      });
      (mockPrisma.leads.update as jest.Mock).mockResolvedValue(mockLead);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await persistExtractedData(1, {
        customer_name: null,
        customer_number: null,
      });

      expect(mockPrisma.leads.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          customer_name: undefined,
          customer_number: undefined,
        }),
      });
    });

    it("should handle backend notification failure gracefully", async () => {
      (mockPrisma.leads.findUnique as jest.Mock).mockResolvedValue({
        provider: "Google LSA",
      });
      (mockPrisma.leads.update as jest.Mock).mockResolvedValue(mockLead);
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      // Should not throw
      await expect(
        persistExtractedData(1, extractedData),
      ).resolves.not.toThrow();
    });

    it("should throw error if database update fails", async () => {
      (mockPrisma.leads.findUnique as jest.Mock).mockResolvedValue({
        provider: "Google LSA",
      });
      (mockPrisma.leads.update as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(persistExtractedData(1, extractedData)).rejects.toThrow(
        "Failed to persist extracted data",
      );
    });
  });

  describe("triggerCommunication", () => {
    beforeEach(() => {
      process.env.COMMS_WEBHOOK_URL = "http://comms.example.com/webhook";
    });

    it("should trigger communication successfully", async () => {
      (mockPrisma.leads.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 1,
          customer_name: "John Doe",
          customer_number: "555-1234",
          customer_address: "123 Main St",
          service_requested: "Plumbing",
          status: "new",
        })
        .mockResolvedValueOnce({
          provider: "Google LSA",
        });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await triggerCommunication(1);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://comms.example.com/webhook",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("lead.processed"),
        }),
      );
    });

    it("should skip communication if COMMS_WEBHOOK_URL is not set", async () => {
      delete process.env.COMMS_WEBHOOK_URL;

      await triggerCommunication(1);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle lead not found error", async () => {
      (mockPrisma.leads.findUnique as jest.Mock).mockResolvedValue(null);

      // Should not throw - communication failure shouldn't fail workflow
      await expect(triggerCommunication(999)).resolves.not.toThrow();
    });

    it("should handle communication service error gracefully", async () => {
      (mockPrisma.leads.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockLead)
        .mockResolvedValueOnce({ provider: "Google LSA" });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Internal Server Error"),
      });

      // Should not throw
      await expect(triggerCommunication(1)).resolves.not.toThrow();
    });

    it("should handle network errors gracefully", async () => {
      (mockPrisma.leads.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockLead)
        .mockResolvedValueOnce({ provider: "Google LSA" });
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      // Should not throw
      await expect(triggerCommunication(1)).resolves.not.toThrow();
    });
  });

  describe("updateStatus", () => {
    it("should update status successfully", async () => {
      (mockPrisma.leads.update as jest.Mock).mockResolvedValue(mockLead);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await updateStatus(1, "processed");

      expect(mockPrisma.leads.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "processed" },
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/leads/notify-update",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ leadId: 1 }),
        }),
      );
    });

    it("should handle backend notification failure gracefully", async () => {
      (mockPrisma.leads.update as jest.Mock).mockResolvedValue(mockLead);
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      // Should not throw
      await expect(updateStatus(1, "processed")).resolves.not.toThrow();
    });

    it("should throw error if database update fails", async () => {
      (mockPrisma.leads.update as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(updateStatus(1, "processed")).rejects.toThrow(
        "Failed to update status",
      );
    });
  });
});
