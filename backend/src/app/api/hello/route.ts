import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{}> },
) {
  return NextResponse.json({ message: "Hello!" });
}
