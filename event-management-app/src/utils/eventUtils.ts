import type { EventType } from "../types/Event";

export const getEventStatusText = (active: number): string => {
  switch (active) {
    case 0:
      return "Đã hủy";
    case 1:
      return "Sắp diễn ra";
    case 2:
      return "Đang diễn ra";
    case 3:
      return "Đã kết thúc";
    case 4:
      return "Đã xóa";
    default:
      return "Không xác định";
  }
};

export const getModeActiveColor = (active: number): string => {
  switch (active) {
    case 0:
      return "gray";
    case 1:
      return "green";
    case 2:
      return "orange";
    case 3:
      return "red";
    case 4:
      return "#999";
    default:
      return "black";
  }
};

//  Hàm đổi màu chữ theo hình thức sự kiện
export const getModeColor = (mode: EventType["eventMode"]) => {
  switch (mode) {
    case "ONLINE":
      return "green"; // Trực tuyến
    case "OFFLINE":
      return "blue"; // Trực tiếp
    case "HYBRID":
      return "orange"; // Kết hợp
    default:
      return "gray";
  }
};

