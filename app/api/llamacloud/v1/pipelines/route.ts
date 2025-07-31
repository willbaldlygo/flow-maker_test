import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // MODIFICATION: Use the environment variable directly
    const llamaCloudApiKey = process.env.LLAMACLOUD_API_KEY;

    if (!llamaCloudApiKey) {
        return NextResponse.json({ error: 'LlamaCloud API key not configured on the server.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.cloud.llamaindex.ai/api/v1/pipelines?project_id=${projectId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // MODIFICATION: Use the server-side key
                'Authorization': `Bearer ${llamaCloudApiKey}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Failed to fetch from LlamaCloud: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
