#!/usr/bin/env python
# _*_ coding: utf-8 _*_

from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class WatchHistory(SQLModel, table=True):
    """
    Registro de cada vez que un usuario reproduce un contenido.
    """
    __tablename__ = "watch_history"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Identificador del usuario (sub claim del JWT de FusionAuth)
    user_id: str = Field(index=True, max_length=100)

    # ID del contenido en TMDB
    content_id: str = Field(index=True, max_length=50)

    # "movie" o "tv"
    content_type: str = Field(max_length=10)

    # Título del contenido al momento de la vista
    title: str = Field(max_length=255)

    # Timestamp UTC de cuando se registró la vista
    watched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WatchHistoryCreate(SQLModel):
    """
    Schema para el body del endpoint POST /api/content/watch.
    """
    content_id: str
    content_type: str  # "movie" o "tv"
    title: str
