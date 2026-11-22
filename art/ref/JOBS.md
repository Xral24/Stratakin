# Reference pictures, batch 1 (22 Nov 2026), Nano Banana, 2 credits each
Higgsfield job ids (files at https://d8j0ntlcm91z4.cloudfront.net/user_3MStP8inDTZqzXdo8y7jmI6IYMU/hf_<date>_<job>.png, see each job's result_url). Waiting for Alexander's verdict.

| # | Subject | Job id |
|---|---|---|
| 0 | Earth, first village (third person) | b939ffad-3a16-4d85-8ce1-cb6706b45b21 |
| 1 | Earth, countryside with Kin | a1459265-c5ae-4499-81d8-cfe0560dc413 |
| 2 | Moon town | ca157a95-34ad-4156-84e0-73cda220f1be |
| 3 | The Starwell with the Starlark | 55461ac5-364a-4612-ae39-474fa9270085 |
| 4 | Halo town | 259610c8-7e32-489d-a9e9-415ad98dd773 |
| 5 | The Pit | f024fcd7-4daf-461b-b8f4-d9922570e010 |
| 6 | Mine gallery (cubes underground) | cabf749f-072f-4c09-ac6b-be7b4834afd0 |
| 7 | Professor Finch | cc7b08fd-92d0-4cde-a560-91129c0dbcf1 |
| 8 | Keychain, Stonewall, Bigmouth | 13d08611-43b1-4f47-a445-6580a53a081f |
| 9 | Silas Pennywise | 86400158-7030-463c-8b16-9f6e6498e37c |

Downloading needs d8j0ntlcm91z4.cloudfront.net allowed in Settings > Capabilities (it was refused with only package managers allowed).

# Batch 2 (22 Nov, after downloads opened)
| What | Job id | Credits |
|---|---|---|
| Finch, front view for 3D | 7f803db8-833d-450d-bd25-481e3fa8ea6d | 2 |
| Finch 3D model, Tripo H3.1 (faces +x, turn -90 degrees) | 976cb3a8-0b73-4104-ae54-10c4353f7255 | 9 |
| Finch rigged, 24 joints, idle clip (clip unusable: fitted sideways) | db601a6c-bc6c-48fd-8ebb-2f632f5505fa | 8 |
| Keychain front | e9deb8be-7bce-4c7a-912a-1b5b33f7c73c | 2 |
| Stonewall front | 402d8298-5707-45f3-bcfc-fd2c19a09da0 | 2 |
| Bigmouth front (ladle wrong, redone) | c53db723-6e2e-42dd-8906-197fe77fdb7a | 2 |
| Bigmouth front, fixed | fb5849d3-6911-49e9-986a-65629e60a6fc | 2 |
| Silas front (three hands, rejected) | bb1b6b6a-08dd-4145-8416-b0bc45841b5c | 2 |
| Silas front, second try (three hands again, rejected) | 08884172-05ff-458a-88f6-acdde0b66c92 | 2 |
| Silas front, empty-handed (checked: two arms, two hands, abacus on a belt hook) | 04538087-3a58-497e-96a8-1c15e220ee41 | 2 |
| Keychain 3D, Tripo H3.1 align_image | aeba82dd-f2cc-4071-b7b4-381c96ee99c3 | 9 |
| Stonewall 3D, Tripo H3.1 align_image | 98bc8402-e8d5-47df-a3ba-92c4225a390b | 9 |
| Bigmouth 3D, Tripo H3.1 align_image | d1a55a78-e505-4aae-9f4e-fdc7606735b2 | 9 |
| Silas 3D, Tripo H3.1 align_image | 3104641a-24aa-46b8-bc12-98d4e084dac2 | 9 |

Lessons: check every picture for extra limbs before it becomes a model; held props invite extra hands. `orientation: align_image` does not make the model face +z (it only copies the picture's angle); run face_front.py instead, and rig only a model that faces +z, or the rig's clips come out twisted.

# Batch 3: models square to the front, then rigs (22 Nov)
`align_image` turned out to be a node matrix that copies the picture's three-quarter angle; Tripo's own front is +x either way.
`tools/art/face_front.py` drops the matrix and turns the mesh so it faces +z, then the file is uploaded (media_upload, PUT, media_confirm) and rigged from that URL.

| What | Job id / media id | Credits |
|---|---|---|
| Uploads (front-facing): keychain c7a74ecb, stonewall 145303fe, bigmouth 6752cacd, silas 4837a682, finch 163db98c | media | 0 |
| Keychain rig + Proud_Strut walk (114) | a7ad7894-00bf-47f9-a70e-bd08dd9f6436 | 8 |
| Stonewall rig + Slow_Orc_Walk (119) | 8b20f66f-064c-4327-a0f8-1658072ffb72 | 8 |
| Bigmouth rig + Casual_Walk (30) | 0297e355-c208-4b7a-a4c1-d5a1892a073b | 8 |
| Silas rig + Idle_13, the showman's patter (253) | 7661a953-28a7-4083-b168-28303a86cc95 | 8 |
| Finch re-rig, front-facing, + Idle_4 (244) | ac5a7e6b-8d9b-43af-9625-947f2cd11871 | 8 |

# Batch 4: front views for the rest of the main cast (22 Nov), Nano Banana Pro with the Finch and Keychain fronts as style references, 2 each
| Who | Job id | Credits |
|---|---|---|
| The Kinmaster | c657bbbf-2a43-48f0-a40e-3d9f8a49f123 | 2 |
| Pit Boss Varga | ed91bbc3-a3db-42f4-a268-46f37e582dde | 2 |
| Elder Hask | c57153ac-1374-441c-9739-e852a37b3161 | 2 |
| Foreman Garrick (a glove hung on his belt like a third hand: redone) | 28a815f3-7cef-4546-a12e-d0ef7b783c93 | 2 |
| Foreman Garrick, bare hands, nothing on the belt | 806fa291-a5c5-47de-83cf-40bc7b70d9f5 | 2 |
| Maren | 57142383-8531-4a6a-b18a-3682c70621a6 | 2 |
| Old Brannock | 5678617a-7203-49f6-8efc-e9df470d2e06 | 2 |

Checked limb by limb: Kinmaster, Varga, Hask, Maren, Brannock all two arms and two hands. Models (Tripo H3.1, default orientation, 9 each):
| Who | Job id |
|---|---|
| Kinmaster | d14381cd-d233-4034-a637-57547cfb8741 |
| Varga | 92676fbb-abd9-4125-a008-ae82b4a57c6e |
| Hask | b3396b89-1f84-4118-b8e4-c43ab9e9e176 |
| Maren | 1dca54af-ce81-4ade-81c2-8351c7cfda72 |
| Brannock | cc4e0422-1e9a-499a-b8d3-2d46f74a0dd5 |

| Garrick (bare hands) | af8b0334-9f1c-43f1-95b7-709b4904de2b |

Front-facing uploads: kinmaster 9a993b3c, varga 0373d1de, hask 2409eb06, maren 66081c2a, brannock eb588d13. Rigs (8 each):
| What | Job id |
|---|---|
| Kinmaster + Idle_02 (11) | fe9be093-538f-4ee0-b24e-a73a78e35af7 |
| Varga + Idle (0) | 99f094c4-b5d4-4ee3-b173-1d2919fbce24 |
| Hask + Elderly_Shaky_Walk_inplace (626) | 775f03d0-bd21-4c5f-b1f8-210537059a34 |
| Hask + Idle_9 (249), to merge with the walk | 0d94c79a-0c8f-49fb-a8c0-d5ad4eeaf68b |
| Maren + Idle_3 (243) | fe8fd5ee-6a05-46d9-af18-130a7db22c7d |
| Brannock + Idle_12 (252) | 9c2f3ea0-3730-416e-8fa8-4a4b25a679dd |
| Garrick (upload 67285ae1) + Idle (0) | d483271d-7e14-4e63-82c7-ab806fe57f8f |

# Quality test (22 Nov, evening): Alexander called the cast models poor. They were Tripo H3.1 on its cheapest settings (10k faces, standard texture and shape), with textures cut to 1024 on the phone. Three top-end versions of Finch to compare, each with full PBR maps:
| Model | Job id | Credits |
|---|---|---|
| Tripo H3.1, detailed texture, detailed geometry, adaptive faces | 87f56dd4-e238-4e96-9823-b144d62c1199 | 18 |
| Tripo P2, extreme texture, 50k faces | bc766e84-ebf8-4142-acac-e121e7aaba88 | 40 |
| Meshy 7, ultra mode, 50k triangles | e8f8cedf-e33d-4a49-bf7e-0da7299adf18 | 44 |

Winner: Meshy 7 ultra. Side by side at the same 2048 texture, its Finch has the cleanest face and shapes; H3.1 detailed is decent but rougher (and comes as 2 million triangles, cut to 40k), P2 changed his face (eyes off, nose bigger). The cast is redone on Meshy 7 ultra, 50k triangles, A-pose, rigged with a clip in the same call (53.5 each):
| Who | Job id | Clip |
|---|---|---|
| Finch | 5b9935ec-b197-4eac-bc9d-d533d0baa1c0 | Idle_4 (244) |
| Silas | b942cecf-784b-4a6c-97f1-6f69d9952068 | Idle_13 (253) |
| Kinmaster | 4d40abb7-5eeb-465a-b548-807f8c35de26 | Idle_02 (11) |
| Varga | aedb15ce-6cfc-4947-b677-97dbae0ddbea | Idle (0) |
| Hask | e9931beb-b4d8-499e-bb82-86490e86fd38 | Idle_9 (249), walk to add |
| Garrick | f7bcbe1b-51fc-4e63-aa95-8fcc627520b2 | Idle (0) |
| Maren | 01d02636-7284-4b92-93e0-b09e5af62678 | Idle_3 (243) |
| Brannock | a17b205b-cef0-4c20-9710-009d1ec90224 | Idle_12 (252) |
| Stonewall | 16797cdf-ec09-4566-b807-7af79dfb3344 | Slow_Orc_Walk (119), idle to add |

The tyrants are Kin in the story (bound by the Kinmaster's crystal), so Keychain and Bigmouth go back to creature bodies with the approved outfits (Stonewall's brick body already reads as a creature). Two options each, for Alexander to choose (2 credits each):
| What | Job id |
|---|---|
| Keychain, slim lizard, key planted like a staff | 6a937aa9-274a-4b86-b606-3d6329ac4436 |
| Keychain, chameleon, hand on hip | 536b3427-f8a2-4d72-a8ac-05b7cf5a611b |
| Bigmouth, giant toad, spoon as a staff | 451e3626-3870-4a00-8c7f-59684f11a4a6 |
| Bigmouth, bullfrog with a chef's cap | e8b09956-b514-4f3f-b56a-208f57578640 |

Second clips for the two figures that need both an idle and a walk, rigged from their own Meshy mesh with the skin taken off (tools/art/strip_skin.py), 8 credits each. Hask's old walk (Elderly_Shaky_Walk) shook by design, which is half of why he vibrated: he gets Thoughtful_Walk instead.
| Who | Job id | Clip |
|---|---|---|
| Hask | 1e6d8d6b-3be4-42a6-b3cc-7b5e32471a6d | Thoughtful_Walk (121) |
| Stonewall | f4bc9956-adc1-405e-b60e-d6510635c35f | Idle_11 (251) |
