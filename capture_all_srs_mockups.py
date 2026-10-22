import os
import time
import json
import base64
import urllib.request
import subprocess
import asyncio
import websockets

OUTPUT_DIR = r"D:\isp392\docs\screenshots_srs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

EDGE_BIN = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
REMOTE_PORT = 9225

CUSTOMER_USER = {
    "id": "USR-101",
    "userId": 101,
    "fullName": "Nguyễn Văn An",
    "email": "customer@farmely.vn",
    "role": "CUSTOMER",
    "phone": "0912345678",
    "address": "Quận 1, TP. Hồ Chí Minh",
    "roleTitle": "Khách hàng thuê đất",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
}

EXPERT_USER = {
    "id": "USR-102",
    "userId": 102,
    "fullName": "Kỹ sư Trần Minh Quang",
    "email": "expert@farmely.vn",
    "role": "EXPERT",
    "phone": "0987654321",
    "address": "TP. Thủ Đức, TP. Hồ Chí Minh",
    "roleTitle": "Chuyên gia nông nghiệp (CGNN)",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
}

STAFF_USER = {
    "id": "USR-103",
    "userId": 103,
    "fullName": "Lê Văn Thành",
    "email": "worker@farmely.vn",
    "role": "STAFF",
    "phone": "0909123456",
    "address": "Củ Chi, TP. Hồ Chí Minh",
    "roleTitle": "Chuyên viên lao động hiện trường (CVLĐ)",
    "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
}

ADMIN_USER = {
    "id": "USR-100",
    "userId": 100,
    "fullName": "Quản Trị Viên Hệ Thống",
    "email": "admin@farmely.vn",
    "role": "ADMIN",
    "phone": "0900000000",
    "address": "Trụ sở Farmely",
    "roleTitle": "Quản trị viên hệ thống (Admin)",
    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
}

TASKS = [
    {
        "id": "SCR-PUB-01",
        "file": "Figure_3.2.0-1_SCR-PUB-01_Trang_Chu.png",
        "url": "http://localhost:3000/",
        "user": None,
        "width": 1366,
        "height": 768,
        "delay": 2.5
    },
    {
        "id": "SCR-PUB-02",
        "file": "Figure_3.2.1-1_SCR-PUB-02_Customer_Registration.png",
        "url": "http://localhost:3000/register",
        "user": None,
        "width": 1366,
        "height": 768,
        "delay": 1.5
    },
    {
        "id": "SCR-PUB-03",
        "file": "Figure_3.2.2-1_SCR-PUB-03_User_Login.png",
        "url": "http://localhost:3000/login?demo=false",
        "user": None,
        "width": 1366,
        "height": 768,
        "delay": 1.5
    },
    {
        "id": "SCR-PUB-04",
        "file": "Figure_3.2.x-1_SCR-PUB-04_Quen_Mat_Khau.png",
        "url": "http://localhost:3000/forgot-password",
        "user": None,
        "width": 1366,
        "height": 768,
        "delay": 1.5
    },
    {
        "id": "SCR-PUB-05-VIEWPORT",
        "file": "Figure_3.2.3-1_SCR-PUB-05_OnSite_Inspection_Booking.png",
        "url": "http://localhost:3000/site-visit/book",
        "user": None,
        "width": 1366,
        "height": 768,
        "delay": 2.0
    },
    {
        "id": "SCR-PUB-05-FULL",
        "file": "Figure_3.2.3-2_SCR-PUB-05_OnSite_Inspection_Booking_FullForm.png",
        "url": "http://localhost:3000/site-visit/book",
        "user": None,
        "width": 1366,
        "height": 1750,
        "delay": 2.0
    },
    {
        "id": "SCR-KH-02",
        "file": "Figure_3.3.1-1_SCR-KH-02_Marketplace_San_Thua_Dat.png",
        "url": "http://localhost:3000/marketplace",
        "user": None,
        "width": 1366,
        "height": 768,
        "delay": 3.0
    },
    {
        "id": "SCR-KH-03",
        "file": "Figure_3.3.2-1_SCR-KH-03_Chi_Tiet_Thua_Dat_Drawer.png",
        "url": "http://localhost:3000/marketplace?plot=P-04",
        "user": None,
        "width": 1366,
        "height": 768,
        "delay": 3.0
    },
    {
        "id": "SCR-KH-04",
        "file": "Figure_3.3.3-1_SCR-KH-04_Master_Lease_Agreement_Config.png",
        "url": "http://localhost:3000/marketplace/plot/P-04/book",
        "user": CUSTOMER_USER,
        "width": 1366,
        "height": 850,
        "delay": 2.5
    },
    {
        "id": "SCR-KH-06",
        "file": "Figure_3.3.4-1_SCR-KH-06_Customer_Dashboard_FarmDiary_IoT.png",
        "url": "http://localhost:3000/customer/dashboard",
        "user": CUSTOMER_USER,
        "width": 1366,
        "height": 850,
        "delay": 2.5
    },
    {
        "id": "SCR-CGNN-01",
        "file": "Figure_3.4.1-1_SCR-CGNN-01_Expert_Dashboard_VietGAP.png",
        "url": "http://localhost:3000/expert/dashboard",
        "user": EXPERT_USER,
        "width": 1366,
        "height": 850,
        "delay": 2.5
    },
    {
        "id": "SCR-CVLD-01",
        "file": "Figure_3.5.1-1_SCR-CVLD-01_FieldWorker_Dashboard_Tasks.png",
        "url": "http://localhost:3000/staff/dashboard",
        "user": STAFF_USER,
        "width": 1366,
        "height": 850,
        "delay": 2.5
    },
    {
        "id": "SCR-AD-01",
        "file": "Figure_3.6.1-1_SCR-AD-01_Admin_Master_Data_Dashboard.png",
        "url": "http://localhost:3000/admin/master-data",
        "user": ADMIN_USER,
        "width": 1366,
        "height": 850,
        "delay": 2.5
    }
]

async def send_cdp(ws, msg_id, method, params=None):
    payload = {"id": msg_id, "method": method}
    if params:
        payload["params"] = params
    await ws.send(json.dumps(payload))
    while True:
        res = await ws.recv()
        data = json.loads(res)
        if data.get("id") == msg_id:
            return data

async def run_capture():
    print(f"Khởi động Edge headless với remote debugging cổng {REMOTE_PORT}...")
    proc = subprocess.Popen([
        EDGE_BIN,
        "--headless",
        "--disable-gpu",
        f"--remote-debugging-port={REMOTE_PORT}",
        "http://localhost:3000"
    ])
    await asyncio.sleep(2.5)

    try:
        resp = urllib.request.urlopen(f"http://localhost:{REMOTE_PORT}/json")
        targets = json.loads(resp.read())
        page = next(t for t in targets if t.get("type") == "page")
        ws_url = page["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=50 * 1024 * 1024) as ws:
            msg_id = 1
            await send_cdp(ws, msg_id, "Page.enable")
            msg_id += 1
            await send_cdp(ws, msg_id, "DOM.enable")
            msg_id += 1
            await send_cdp(ws, msg_id, "Network.enable")
            msg_id += 1

            for item in TASKS:
                print(f"[{item['id']}] Đang chuẩn bị chụp: {item['file']} ({item['url']})...")
                # Điều chỉnh viewport
                await send_cdp(ws, msg_id, "Emulation.setDeviceMetricsOverride", {
                    "width": item["width"],
                    "height": item["height"],
                    "deviceScaleFactor": 1.5,
                    "mobile": False
                })
                msg_id += 1

                # Navigate
                await send_cdp(ws, msg_id, "Page.navigate", {"url": item["url"]})
                msg_id += 1
                await asyncio.sleep(1.0)

                # Set Auth nếu cần
                if item["user"]:
                    user_json = json.dumps(item["user"])
                    token = f"demo-token-{item['user']['id']}"
                    auth_json = json.dumps({"token": token, "user": item["user"]})
                    script = f"""
                    localStorage.setItem('farmely_token', '{token}');
                    localStorage.setItem('farmely_user', JSON.stringify({user_json}));
                    localStorage.setItem('farmely_auth', JSON.stringify({auth_json}));
                    """
                    await send_cdp(ws, msg_id, "Runtime.evaluate", {"expression": script})
                    msg_id += 1
                    # Reload lại sau khi set auth để app re-render với role tương ứng
                    await send_cdp(ws, msg_id, "Page.reload")
                    msg_id += 1
                else:
                    clear_script = """
                    localStorage.removeItem('farmely_token');
                    localStorage.removeItem('farmely_user');
                    localStorage.removeItem('farmely_auth');
                    """
                    await send_cdp(ws, msg_id, "Runtime.evaluate", {"expression": clear_script})
                    msg_id += 1

                await asyncio.sleep(item["delay"])

                # Capture screenshot
                shot_res = await send_cdp(ws, msg_id, "Page.captureScreenshot", {
                    "format": "png",
                    "fromSurface": True
                })
                msg_id += 1

                if "result" in shot_res and "data" in shot_res["result"]:
                    img_data = base64.b64decode(shot_res["result"]["data"])
                    target_file = os.path.join(OUTPUT_DIR, item["file"])
                    with open(target_file, "wb") as f:
                        f.write(img_data)
                    sz_kb = len(img_data) / 1024
                    print(f"  ✓ Đã lưu thành công: {item['file']} ({sz_kb:.1f} KB)")
                else:
                    print(f"  ✕ Không lấy được dữ liệu ảnh cho {item['id']}")

    finally:
        proc.terminate()
        print("\n=== HOÀN TẤT TOÀN BỘ TIẾN TRÌNH CHỤP ẢNH MOCKUP CHO SRS ===")

if __name__ == "__main__":
    asyncio.run(run_capture())
