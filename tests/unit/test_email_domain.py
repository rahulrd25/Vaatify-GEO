from src.geo_tracker.api.utils.email_domain import extract_brand_from_email

def test_extract_brand_from_work_email():
    res = extract_brand_from_email("sarah@figma.com")
    assert res["is_work_email"] is True
    assert res["domain"] == "figma.com"
    assert res["name"] == "Figma"

def test_extract_brand_from_subdomain():
    res = extract_brand_from_email("john@mail.acme.com")
    assert res["is_work_email"] is True
    assert res["domain"] == "acme.com"
    assert res["name"] == "Acme"

def test_extract_brand_from_two_part_tld():
    res = extract_brand_from_email("team@acme-corp.co.uk")
    assert res["is_work_email"] is True
    assert res["domain"] == "acme-corp.co.uk"
    assert res["name"] == "Acme Corp"

def test_reject_generic_webmail():
    for webmail in ["user@gmail.com", "test@yahoo.com", "dev@hotmail.com", "founder@proton.me"]:
        res = extract_brand_from_email(webmail)
        assert res["is_work_email"] is False
        assert res["domain"] == ""
        assert res["name"] == ""

def test_handle_invalid_emails():
    assert extract_brand_from_email("")["is_work_email"] is False
    assert extract_brand_from_email("invalid")["is_work_email"] is False
    assert extract_brand_from_email("user@localhost")["is_work_email"] is False
