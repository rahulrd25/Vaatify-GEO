"""
Email Domain & Brand Name Extraction Utility.
Detects corporate work email domains and extracts clean brand names,
filtering out common public webmail providers.
"""
from typing import Dict, Any

COMMON_WEBMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in",
    "hotmail.com", "outlook.com", "live.com", "msn.com",
    "icloud.com", "me.com", "mac.com", "aol.com", "aim.com",
    "zoho.com", "proton.me", "protonmail.com", "mail.com", "gmx.com",
    "gmx.net", "yandex.com", "yandex.ru", "fastmail.com", "tutanota.com"
}

def extract_brand_from_email(email: str) -> Dict[str, Any]:
    """
    Extracts brand domain and inferred brand name from an email address.
    
    Examples:
        'sarah@figma.com' -> {'domain': 'figma.com', 'name': 'Figma', 'is_work_email': True}
        'john@sub.acme.com' -> {'domain': 'acme.com', 'name': 'Acme', 'is_work_email': True}
        'alex@gmail.com' -> {'domain': '', 'name': '', 'is_work_email': False}
    """
    if not email or "@" not in email:
        return {"domain": "", "name": "", "is_work_email": False}

    parts = email.strip().lower().split("@")
    if len(parts) != 2:
        return {"domain": "", "name": "", "is_work_email": False}

    raw_domain = parts[1].strip()
    if not raw_domain or "." not in raw_domain:
        return {"domain": "", "name": "", "is_work_email": False}

    if raw_domain in COMMON_WEBMAIL_DOMAINS:
        return {"domain": "", "name": "", "is_work_email": False}

    # Normalize subdomain: e.g. 'mail.acme.com' or 'eng.corp.acme.co.uk'
    domain_parts = raw_domain.split(".")
    
    # Handle two-part TLDs like .co.uk, .com.au, .co.in
    two_part_tlds = {"co.uk", "com.au", "co.in", "com.br", "org.uk", "gov.uk"}
    last_two = ".".join(domain_parts[-2:])
    
    if last_two in two_part_tlds and len(domain_parts) >= 3:
        registered_domain = ".".join(domain_parts[-3:])
        base_name = domain_parts[-3]
    else:
        registered_domain = ".".join(domain_parts[-2:])
        base_name = domain_parts[-2]

    # Clean and capitalize base name (e.g. 'acme-corp' -> 'Acme Corp', 'open-ai' -> 'Open AI')
    clean_name = base_name.replace("-", " ").replace("_", " ").title()

    return {
        "domain": registered_domain,
        "name": clean_name,
        "is_work_email": True
    }
