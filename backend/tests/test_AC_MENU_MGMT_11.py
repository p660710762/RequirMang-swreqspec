from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app, headers={"X-User-Id": "admin"})


def test_TC_MENU_MGMT_11_1_invalid_menu_data_is_rejected():
    # Given Admin กรอกข้อมูลเมนูไม่ครบถ้วนหรือไม่ถูกต้อง โดยมีอย่างน้อยหนึ่งข้อมูลที่ต้องแก้ไข
    before = client.get("/api/admin/menu").json()["menu_items"]

    # When Admin กดบันทึก
    response = client.post(
        "/api/admin/menu",
        json={"price": 40, "status": "open"},
    )

    # Then ระบบไม่บันทึกข้อมูล และแจ้งให้ Admin แก้ไขข้อมูล
    after = client.get("/api/admin/menu").json()["menu_items"]
    assert response.status_code == 400
    assert response.json()["detail"]
    assert after == before


def test_TC_MENU_MGMT_11_2_required_fields_without_optional_fields_are_accepted():
    # Given Admin กรอกข้อมูลเมนูครบถ้วนตามขั้นต่ำ ได้แก่ ชื่อ ราคา และสถานะ โดยไม่กรอกรายละเอียดหรือรูปภาพ
    payload = {"name": "เมนู AC-11 ขั้นต่ำ", "price": 40, "status": "open"}

    # When Admin กดบันทึก
    response = client.post("/api/admin/menu", json=payload)

    # Then ระบบบันทึกข้อมูลเมนู และไม่แจ้งข้อผิดพลาดจากการเว้นรายละเอียดหรือรูปภาพ
    assert response.status_code == 200
    assert response.json()["name"] == payload["name"]
    assert response.json()["description"] is None
    assert response.json()["image_url"] is None

    client.delete(f"/api/admin/menu/{response.json()['menu_id']}")


def test_TC_MENU_MGMT_11_3_invalid_price_or_status_is_rejected():
    # Given Admin กรอกข้อมูลเมนูที่มีราคาไม่ถูกต้องหรือสถานะไม่ใช่ค่าที่รองรับ
    invalid_price = {"name": "เมนูราคาไม่ถูกต้อง", "price": 0, "status": "open"}
    invalid_status = {"name": "เมนูสถานะไม่ถูกต้อง", "price": 40, "status": "inactive"}

    # When Admin กดบันทึก
    price_response = client.post("/api/admin/menu", json=invalid_price)
    status_response = client.post("/api/admin/menu", json=invalid_status)

    # Then ระบบไม่บันทึกข้อมูล และแจ้งให้ Admin แก้ไขข้อมูล
    assert price_response.status_code == 400
    assert price_response.json()["detail"]
    assert status_response.status_code == 400
    assert status_response.json()["detail"]
