/**
 * Haversine formula - tính khoảng cách giữa 2 điểm địa lý
 * @param lat1 - Latitude của điểm 1 (độ)
 * @param lon1 - Longitude của điểm 1 (độ)
 * @param lat2 - Latitude của điểm 2 (độ)
 * @param lon2 - Longitude của điểm 2 (độ)
 * @returns Khoảng cách tính bằng mét
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Bán kính Trái Đất tính bằng mét

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Khoảng cách tính bằng mét
};

/**
 * Lấy vị trí hiện tại của người dùng
 * @returns Promise với {latitude, longitude} hoặc reject nếu lỗi
 */
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ Geolocation"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Accuracy:", position.coords.accuracy);
        console.log("Latitude:", position.coords.latitude);
        console.log("Longitude:", position.coords.longitude);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMsg = "Không thể lấy vị trí hiện tại";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Bạn chưa cấp quyền truy cập vị trí. Vui lòng cho phép trình duyệt truy cập vị trí.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Vị trí không khả dụng";
            break;
          case error.TIMEOUT:
            errorMsg = "Hết thời gian chờ lấy vị trí";
            break;
        }
        reject(new Error(errorMsg));
      },{
        maximumAge: 0,

      }

    );
  });
};
