import pytest


@pytest.mark.asyncio
async def test_root(client):
    response = await client.get("/root")

    assert response.status_code == 200
    assert response.json()["message"] == "Welcome Velmio"
