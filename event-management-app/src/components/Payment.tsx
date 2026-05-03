import {
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  FileText,
  Hash,
  Home,
  XCircle,
} from "lucide-react";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import { useEffect, useState } from "react";

function Payment() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vnp_ResponseCode = urlParams.get("vnp_ResponseCode");
    const vnp_TransactionStatus = urlParams.get("vnp_TransactionStatus");
    const vnp_Amount = urlParams.get("vnp_Amount");
    const vnp_BankCode = urlParams.get("vnp_BankCode");
    const vnp_BankTranNo = urlParams.get("vnp_BankTranNo");
    const vnp_CardType = urlParams.get("vnp_CardType");
    const vnp_OrderInfo = urlParams.get("vnp_OrderInfo");
    const vnp_PayDate = urlParams.get("vnp_PayDate");
    const vnp_TransactionNo = urlParams.get("vnp_TransactionNo");
    const vnp_TxnRef = urlParams.get("vnp_TxnRef");

    const formattedAmount = vnp_Amount
      ? (parseInt(vnp_Amount) / 100).toLocaleString("vi-VN")
      : "0";

    const formatDate = (dateStr: string | null) => {
      if (!dateStr || dateStr.length !== 14) return dateStr;
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(8, 10);
      const minute = dateStr.substring(10, 12);
      const second = dateStr.substring(12, 14);
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    };

    const decodedOrderInfo = vnp_OrderInfo
      ? decodeURIComponent(vnp_OrderInfo)
      : "";

    const getBankName = (code: string | null) => {
      const banks: Record<string, string> = {
        NCB: "Ngân hàng NCB",
        VIETCOMBANK: "Vietcombank",
        VIETINBANK: "VietinBank",
        BIDV: "BIDV",
        TECHCOMBANK: "Techcombank",
        MBBANK: "MB Bank",
        SACOMBANK: "Sacombank",
      };
      return code ? banks[code] || code : "";
    };

    const getStatusMessage = (code: string | null) => {
      const statusMessages: Record<string, string> = {
        "00": "Giao dịch thành công",
        "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ.",
        "09": "Giao dịch không thành công: chưa đăng ký InternetBanking.",
        "10": "Xác thực thẻ/tài khoản sai quá 3 lần",
        "11": "Đã hết hạn chờ thanh toán.",
        "12": "Tài khoản bị khóa.",
        "13": "Sai mật khẩu OTP.",
        "24": "Khách hàng hủy giao dịch",
        "51": "Tài khoản không đủ số dư.",
        "65": "Vượt hạn mức giao dịch",
        "75": "Ngân hàng bảo trì.",
        "79": "Sai mật khẩu quá số lần quy định.",
        "99": "Các lỗi khác",
      };
      return code ? statusMessages[code] || "Giao dịch thất bại" : "";
    };

    const isSuccess =
      vnp_ResponseCode === "00" && vnp_TransactionStatus === "00";

    setPaymentInfo({
      isSuccess,
      statusMessage: getStatusMessage(vnp_ResponseCode),
      amount: formattedAmount,
      bankName: getBankName(vnp_BankCode),
      bankTranNo: vnp_BankTranNo,
      cardType: vnp_CardType === "ATM" ? "Thẻ ATM" : vnp_CardType,
      orderInfo: decodedOrderInfo,
      payDate: formatDate(vnp_PayDate),
      transactionNo: vnp_TransactionNo,
      txnRef: vnp_TxnRef,
      responseCode: vnp_ResponseCode,
    });
  }, []);

  if (!paymentInfo) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 flex justify-content-center">
      <div style={{ width: "600px" }}>
        <Card
          className={`p-fluid ${
            paymentInfo.isSuccess
              ? "surface-0 border-green-500"
              : "surface-50 border-red-500"
          }`}
        >
          <div className="text-center mb-4">
            {paymentInfo.isSuccess ? (
              <CheckCircle className="text-green-500" size={64} />
            ) : (
              <XCircle className="text-red-500" size={64} />
            )}
            <h2
              className={
                paymentInfo.isSuccess ? "text-green-700" : "text-red-700"
              }
            >
              {paymentInfo.isSuccess
                ? "Thanh toán thành công!"
                : "Thanh toán thất bại"}
            </h2>
            <p>{paymentInfo.statusMessage}</p>
          </div>

          <Card title="Thông tin giao dịch" className="mb-4">
            <div className="mb-3">
              <span className="font-bold">Số tiền: </span>
              {paymentInfo.amount} VNĐ
            </div>
            <div className="grid grid-nogutter">
              <div className="col-6 mb-2 flex align-items-center gap-2">
                <Hash />
                <div>
                  <small>Mã giao dịch VNPay</small>
                  <div>{paymentInfo.transactionNo}</div>
                </div>
              </div>
              <div className="col-6 mb-2 flex align-items-center gap-2">
                <FileText />
                <div>
                  <small>Mã đơn hàng</small>
                  <div>{paymentInfo.txnRef}</div>
                </div>
              </div>
              <div className="col-6 mb-2 flex align-items-center gap-2">
                <Building2 />
                <div>
                  <small>Ngân hàng</small>
                  <div>{paymentInfo.bankName}</div>
                </div>
              </div>
              <div className="col-6 mb-2 flex align-items-center gap-2">
                <CreditCard />
                <div>
                  <small>Loại thẻ</small>
                  <div>{paymentInfo.cardType}</div>
                </div>
              </div>
              <div className="col-6 mb-2 flex align-items-center gap-2">
                <Calendar />
                <div>
                  <small>Thời gian thanh toán</small>
                  <div>{paymentInfo.payDate}</div>
                </div>
              </div>
              <div className="col-6 mb-2 flex align-items-center gap-2">
                <Hash />
                <div>
                  <small>Mã giao dịch ngân hàng</small>
                  <div>{paymentInfo.bankTranNo}</div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <small>Nội dung thanh toán</small>
              <div>{paymentInfo.orderInfo}</div>
            </div>
            <div className="mt-2 text-center text-sm text-gray-500">
              Mã phản hồi: {paymentInfo.responseCode}
            </div>
          </Card>

          <div className="flex justify-content-center gap-2 flex-wrap">
            <Button
              icon={<Home />}
              label="Về trang chủ"
              onClick={() => (window.location.href = "/home")}
              className="p-button-outlined"
            />
          </div>
        </Card>
        <div className="mt-4 text-center text-sm">
          Nếu có thắc mắc, vui lòng liên hệ hotline:{" "}
          <strong>1900 55 55 77</strong>
        </div>
      </div>
    </div>
  );
}

export default Payment;
