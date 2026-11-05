package com.bookingmakeup.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Configuration
public class VNPayConfig {

    @Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpPayUrl;

    @Value("${vnpay.return-url:http://localhost:5173/payment/vnpay-return}")
    private String vnpReturnUrl;

    @Value("${vnpay.tmn-code:CGXZLS0Z}")
    private String vnpTmnCode;

    @Value("${vnpay.hash-secret:XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN}")
    private String vnpHashSecret;

    @Value("${vnpay.version:2.1.0}")
    private String vnpVersion;

    @Value("${vnpay.command:pay}")
    private String vnpCommand;
}
