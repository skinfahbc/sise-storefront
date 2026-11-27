DO $$
DECLARE
  v_tables integer;
  v_functions integer;
  v_triggers integer;
  v_policies integer;
  v_sequences integer;
  v_rls integer;
BEGIN
  SELECT count(*) INTO v_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private') AND c.relkind IN ('r','p');
  IF v_tables <> 13 THEN RAISE EXCEPTION 'Expected 13 application tables, found %', v_tables; END IF;

  SELECT count(*) INTO v_functions
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','private') AND p.prokind IN ('f','p');
  IF v_functions < 19 THEN RAISE EXCEPTION 'Expected at least 19 application functions, found %', v_functions; END IF;

  SELECT count(*) INTO v_triggers
  FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE NOT t.tgisinternal AND n.nspname IN ('public','private');
  IF v_triggers <> 3 THEN RAISE EXCEPTION 'Expected 3 application triggers, found %', v_triggers; END IF;

  SELECT count(*) INTO v_policies FROM pg_policies WHERE schemaname IN ('public','private');
  IF v_policies < 20 THEN RAISE EXCEPTION 'Expected at least 20 RLS policies, found %', v_policies; END IF;

  SELECT count(*) INTO v_sequences
  FROM pg_class s JOIN pg_namespace n ON n.oid=s.relnamespace
  WHERE s.relkind='S' AND n.nspname IN ('public','private');
  IF v_sequences <> 5 THEN RAISE EXCEPTION 'Expected 5 application sequences, found %', v_sequences; END IF;

  SELECT count(*) INTO v_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','private') AND c.relkind IN ('r','p') AND c.relrowsecurity;
  IF v_rls <> 12 THEN RAISE EXCEPTION 'Expected 12 RLS-enabled tables, found %', v_rls; END IF;
END
$$;
