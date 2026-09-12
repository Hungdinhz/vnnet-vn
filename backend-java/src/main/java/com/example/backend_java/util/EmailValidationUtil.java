package com.example.backend_java.util;

import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;
import java.util.regex.Pattern;

public class EmailValidationUtil {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    public static boolean isValidSyntax(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    public static boolean hasMxRecord(String email) {
        if (!isValidSyntax(email)) {
            return false;
        }

        String domain = email.substring(email.indexOf('@') + 1).trim();

        // Local development domains
        if (domain.equalsIgnoreCase("localhost") || domain.equalsIgnoreCase("test.com")) {
            return true;
        }

        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            // Set timeout for DNS lookup (2000ms) to avoid long blocking
            env.put("com.sun.jndi.dns.timeout.initial", "2000");
            env.put("com.sun.jndi.dns.timeout.retries", "1");

            DirContext ictx = new InitialDirContext(env);
            Attributes attrs = ictx.getAttributes(domain, new String[]{"MX"});
            Attribute attr = attrs.get("MX");

            if (attr != null && attr.size() > 0) {
                return true;
            }

            // Fallback: check if domain has an A record (some mail servers accept direct A record)
            Attributes aAttrs = ictx.getAttributes(domain, new String[]{"A"});
            Attribute aAttr = aAttrs.get("A");
            return aAttr != null && aAttr.size() > 0;
        } catch (Exception e) {
            // DNS resolution failed or domain does not exist
            return false;
        }
    }
}
