"""Backward-compatible API adapters for the extracted backend.

The compatibility package is intentionally transport-only. It translates the
old endpoint names and response shapes to the canonical run, real-data and
benchmark services; it does not import the old application entrypoints.
"""
