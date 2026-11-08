import { handleAssistantRequest } from "@/app/api/v1/n8n/route";

export async function POST(request) {
  return handleAssistantRequest(request);
}
