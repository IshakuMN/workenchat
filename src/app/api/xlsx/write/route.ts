import { updateCell } from "@/lib/xlsx";

export async function POST(req: Request) {
  try {
    console.log("Write request received");
    console.log("CWD:", process.cwd());

    const body = await req.json();
    console.log("Request body:", body);

    const { sheet, cell, value } = body;

    if (!sheet || !cell || value === undefined) {
      console.error("Missing fields:", { sheet, cell, value });
      return Response.json(
        {
          success: false,
          error: "Missing required fields: sheet, cell, value",
        },
        { status: 400 },
      );
    }

    console.log(`Attempting to update ${sheet}!${cell} to "${value}"`);
    const success = updateCell(sheet, cell, value);
    console.log("Update result:", success);

    if (success) {
      return Response.json({
        success: true,
        message: `Successfully updated ${sheet}!${cell} to "${value}"`,
      });
    }

    return Response.json({
      success: false,
      error: `Failed to update ${sheet}!${cell}. Sheet may not exist.`,
    });
  } catch (error) {
    console.error("XLSX Write Error (Critical):", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
