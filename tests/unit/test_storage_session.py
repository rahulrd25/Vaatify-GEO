from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.geo_tracker.storage.models import Base, PromptModel

def test_get_db_session_lifecycle():
    # Use SQLite shared memory/engine instance
    engine = create_engine("sqlite:///:memory:", echo=False, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Acquire session
    session = session_factory()
    prompt = PromptModel(id="p-test-session", brand="TestBrand", prompt_text="Testing session lifecycle", active=True)
    session.add(prompt)
    session.commit()
    session.close()

    # Verify query on new session
    session2 = session_factory()
    fetched = session2.query(PromptModel).filter(PromptModel.id == "p-test-session").first()
    assert fetched is not None
    assert fetched.brand == "TestBrand"
    session2.close()
